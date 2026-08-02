from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import pandas as pd
import numpy as np
import uuid
import io
from datetime import datetime
import json
import logging

# Configure logging so debug prints are visible in the console
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def sanitize_for_json(obj: Any) -> Any:
    """Recursively convert numpy/pandas types to native Python types."""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return None if np.isnan(obj) else float(obj)
    elif isinstance(obj, (np.bool_,)):
        return bool(obj)
    elif isinstance(obj, (np.ndarray,)):
        return sanitize_for_json(obj.tolist())
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    elif pd.isna(obj) if not isinstance(obj, (list, dict, np.ndarray)) else False:
        return None
    return obj

from agents.planner_agent import PlannerAgent
from agents.data_worker_agent import DataWorkerAgent
from agents.chart_agent import ChartAgent
from agents.explainer_agent import ExplainerAgent
from utils.file_handler import FileHandler
from utils.agent_coordinator import AgentCoordinator

app = FastAPI(
    title="AI Data Dashboard API",
    description="Multi-agent data analysis API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8443",   # Vite dev server
        "http://localhost:5173",   # Vite fallback
        "http://127.0.0.1:8443",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = "uploads"
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory session storage (in production, use Redis or database)
sessions: Dict[str, Dict[str, Any]] = {}

# Initialize agents
coordinator = AgentCoordinator()
file_handler = FileHandler()

# Pydantic models
class ChatRequest(BaseModel):
    query: str
    session_id: str

class ChatResponse(BaseModel):
    query: str
    timestamp: str
    agent_results: Dict[str, Any]
    final_response: Dict[str, Any]
    followup_questions: List[str]
    confidence_score: float
    error: Optional[str] = None

class UploadResponse(BaseModel):
    success: bool
    filename: str
    session_id: str
    info: Dict[str, Any]
    error: Optional[str] = None

class SessionInfo(BaseModel):
    session_id: str
    filename: str
    uploaded_at: str
    file_info: Dict[str, Any]

# Helper functions
def get_session_path(session_id: str) -> str:
    return os.path.join(UPLOAD_FOLDER, f"{session_id}.csv")

def create_session(filename: str, df: pd.DataFrame) -> str:
    session_id = str(uuid.uuid4())
    session_path = get_session_path(session_id)
    df.to_csv(session_path, index=False)

    # Sanitize all values so Timestamps/numpy types serialize cleanly to JSON
    sessions[session_id] = {
        'filename': filename,
        'uploaded_at': datetime.now().isoformat(),
        'file_info': sanitize_for_json({
            'shape': list(df.shape),
            'columns': df.columns.tolist(),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'head': df.head().to_dict('records')
        })
    }

    return session_id

def load_dataframe(session_id: str) -> pd.DataFrame:
    """
    Load the session CSV and re-apply type cleaning.

    BUG FIX: Previously this called bare pd.read_csv() which returns all
    columns as object/float64 based on naive inference — no datetime parsing,
    no numeric coercion guard.  After the upload path writes the cleaned df
    back to disk, reloading without clean_dataframe() means the chat endpoint
    receives un-typed data and the AI sees NaN-filled numeric columns.

    FIX: Always run file_handler.clean_dataframe() after reading from disk so
    every downstream agent (DataWorker, Explainer, Planner) gets a fully
    typed DataFrame identical to what was originally cleaned at upload time.
    """
    session_path = get_session_path(session_id)
    if not os.path.exists(session_path):
        raise HTTPException(status_code=404, detail="Session not found")

    # Step 1: read raw CSV
    df = pd.read_csv(session_path)

    # ── DEBUG: print full pipeline diagnostics ─────────────────────────────
    logger.debug("=== load_dataframe RAW (before clean) ===")
    logger.debug("Shape: %s", df.shape)
    logger.debug("dtypes:\n%s", df.dtypes)
    logger.debug("isnull().sum():\n%s", df.isnull().sum())
    logger.debug("head():\n%s", df.head().to_string())
    # ───────────────────────────────────────────────────────────────────────

    # Step 2: re-apply cleaning so numeric columns get proper float64 dtype
    df = file_handler.clean_dataframe(df)

    # ── DEBUG: print diagnostics after cleaning ────────────────────────────
    logger.debug("=== load_dataframe CLEANED (after clean) ===")
    logger.debug("Shape: %s", df.shape)
    logger.debug("dtypes:\n%s", df.dtypes)
    logger.debug("isnull().sum():\n%s", df.isnull().sum())
    logger.debug("describe(include='all'):\n%s", df.describe(include='all').to_string())
    logger.debug("head():\n%s", df.head().to_string())
    # ───────────────────────────────────────────────────────────────────────

    return df

def validate_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "AI Data Dashboard API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agents": coordinator.get_agent_status()
    }

@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    # Validate file
    if not file.filename.endswith('.csv'):
        return UploadResponse(
            success=False,
            filename="",
            session_id="",
            info={},
            error="Please upload a CSV file"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        return UploadResponse(
            success=False,
            filename="",
            session_id="",
            info={},
            error="File too large. Maximum size is 16MB"
        )
    
    try:
        # Decode with UTF-8; fall back to latin-1 for non-UTF-8 CSVs
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            text = content.decode('latin-1')
        df = pd.read_csv(io.StringIO(text))

        # ── DEBUG: log raw CSV parse result ───────────────────────────────
        logger.debug("=== UPLOAD: raw pd.read_csv() ===")
        logger.debug("Shape: %s", df.shape)
        logger.debug("dtypes:\n%s", df.dtypes)
        logger.debug("isnull().sum():\n%s", df.isnull().sum())
        logger.debug("head():\n%s", df.head().to_string())
        # ─────────────────────────────────────────────────────────────────

        df = file_handler.clean_dataframe(df)

        # ── DEBUG: log cleaned result ──────────────────────────────────────
        logger.debug("=== UPLOAD: after clean_dataframe() ===")
        logger.debug("Shape: %s", df.shape)
        logger.debug("dtypes:\n%s", df.dtypes)
        logger.debug("isnull().sum():\n%s", df.isnull().sum())
        logger.debug("describe(include='all'):\n%s", df.describe(include='all').to_string())
        logger.debug("head():\n%s", df.head().to_string())
        # ─────────────────────────────────────────────────────────────────
        
        # Create session
        session_id = create_session(file.filename, df)
        
        return UploadResponse(
            success=True,
            filename=file.filename,
            session_id=session_id,
            info=sessions[session_id]['file_info']
        )
    
    except Exception as e:
        return UploadResponse(
            success=False,
            filename="",
            session_id="",
            info={},
            error=f"Error processing file: {str(e)}"
        )

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Validate session
        validate_session(request.session_id)

        # Load dataframe
        df = load_dataframe(request.session_id)

        # Process query through agent system
        response = coordinator.process_query(request.query, df)

        # Hoist confidence_score to top-level to match the original ChatResponse shape
        if 'confidence_score' not in response:
            response['confidence_score'] = response.get('final_response', {}).get('confidence_score', 0.0)

        # Sanitize ALL numpy/pandas types before JSON serialization
        return JSONResponse(content=sanitize_for_json(response))

    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=sanitize_for_json({
                'query': request.query,
                'timestamp': datetime.now().isoformat(),
                'agent_results': {},
                'final_response': {},
                'followup_questions': [],
                'confidence_score': 0.0,
                'error': str(e)
            })
        )

@app.get("/insights/{session_id}")
async def get_insights(session_id: str):
    try:
        # Validate session
        validate_session(session_id)

        # Load dataframe
        df = load_dataframe(session_id)

        # Generate automatic insights and sanitize before serialization
        insights = coordinator.generate_insights(df)
        return JSONResponse(content=sanitize_for_json(insights))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    try:
        validate_session(session_id)
        return sessions[session_id]
    except HTTPException:
        raise

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    try:
        validate_session(session_id)
        
        # Remove file
        session_path = get_session_path(session_id)
        if os.path.exists(session_path):
            os.remove(session_path)
        
        # Remove from memory
        del sessions[session_id]
        
        return {"message": "Session deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents/status")
async def get_agent_status():
    return coordinator.get_agent_status()

@app.post("/agents/reset")
async def reset_agents():
    coordinator.reset_agents()
    return {"message": "Agents reset successfully"}

@app.get("/data/summary/{session_id}")
async def get_data_summary(session_id: str):
    try:
        validate_session(session_id)
        df = load_dataframe(session_id)
        summary = file_handler.get_data_summary(df)
        return JSONResponse(content=sanitize_for_json(summary))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Resource not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
