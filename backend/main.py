from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
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

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session as DBSession

# Configure logging
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

from database import engine, Base, get_db
from models import User, SessionModel, ChatMessageModel
from auth import (
    UserCreate, UserLogin, UserResponse, Token,
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_user_optional
)
from agents.planner_agent import PlannerAgent
from agents.data_worker_agent import DataWorkerAgent
from agents.chart_agent import ChartAgent
from agents.explainer_agent import ExplainerAgent
from utils.file_handler import FileHandler
from utils.agent_coordinator import AgentCoordinator

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AI Data Dashboard API",
    description="Multi-agent data analysis API with enterprise auth, persistence, and security.",
    version="2.0.0"
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
        "http://localhost",
        "http://localhost:80"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = "uploads"
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
from utils.file_handler import FileHandler
from utils.agent_coordinator import AgentCoordinator
from utils.duckdb_engine import DuckDBEngine
from utils.pdf_generator import PDFReportGenerator
from utils.excel_exporter import ExcelWorkbookExporter

# Initialize engines
coordinator = AgentCoordinator()
file_handler = FileHandler()
duckdb_engine = DuckDBEngine()
pdf_generator = PDFReportGenerator()
excel_exporter = ExcelWorkbookExporter()

# Pydantic models
class ChatRequest(BaseModel):
    query: str
    session_id: str

class SQLQueryRequest(BaseModel):
    session_id: str
    query: str

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

# Helper functions
def get_session_path(session_id: str) -> str:
    return os.path.join(UPLOAD_FOLDER, f"{session_id}.csv")

def get_or_create_guest_user(db: DBSession) -> User:
    guest_email = "guest@aidashboard.local"
    user = db.query(User).filter(User.email == guest_email).first()
    if not user:
        user = User(
            id="guest-user-id",
            email=guest_email,
            hashed_password=get_password_hash("guest-password"),
            full_name="Guest User",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def create_db_session(
    filename: str,
    df: pd.DataFrame,
    db: DBSession,
    user: Optional[User] = None
) -> SessionModel:
    session_id = str(uuid.uuid4())
    session_path = get_session_path(session_id)
    df.to_csv(session_path, index=False)

    if not user:
        user = get_or_create_guest_user(db)

    file_info = sanitize_for_json({
        'shape': list(df.shape),
        'columns': df.columns.tolist(),
        'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
        'head': df.head().to_dict('records')
    })

    db_session = SessionModel(
        id=session_id,
        user_id=user.id,
        filename=filename,
        file_path=session_path,
        uploaded_at=datetime.utcnow()
    )
    db_session.file_info = file_info

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return db_session

def load_dataframe_from_db(session_id: str, db: DBSession) -> pd.DataFrame:
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not db_session or not os.path.exists(db_session.file_path):
        raise HTTPException(status_code=404, detail="Session or file not found")

    df = pd.read_csv(db_session.file_path)
    df = file_handler.clean_dataframe(df)
    return df

# ─── Auth Endpoints ─────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=Token)
def register(user_data: UserCreate, db: DBSession = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        created_at=user.created_at.isoformat()
    )
    return Token(access_token=token, user=user_resp)

@app.post("/auth/login", response_model=Token)
def login(login_data: UserLogin, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": user.id})
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        created_at=user.created_at.isoformat()
    )
    return Token(access_token=token, user=user_resp)

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at.isoformat()
    )

# ─── Data & Analysis Endpoints ───────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "AI Data Dashboard API v2.0 (Enterprise Ready)",
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
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if not file.filename.endswith('.csv'):
        return UploadResponse(
            success=False, filename="", session_id="", info={},
            error="Please upload a CSV file"
        )
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        return UploadResponse(
            success=False, filename="", session_id="", info={},
            error="File too large. Maximum size is 16MB"
        )
    
    try:
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            text = content.decode('latin-1')
        df = pd.read_csv(io.StringIO(text))
        df = file_handler.clean_dataframe(df)

        db_session = create_db_session(file.filename, df, db, current_user)
        
        return UploadResponse(
            success=True,
            filename=file.filename,
            session_id=db_session.id,
            info=db_session.file_info
        )
    except Exception as e:
        logger.exception("Upload failed")
        return UploadResponse(
            success=False, filename="", session_id="", info={},
            error=f"Error processing file: {str(e)}"
        )

@app.post("/chat")
@limiter.limit("20/minute")
async def chat(
    request: Request,
    chat_req: ChatRequest,
    db: DBSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        df = load_dataframe_from_db(chat_req.session_id, db)

        # Retrieve chat history for context
        past_msgs = db.query(ChatMessageModel).filter(
            ChatMessageModel.session_id == chat_req.session_id
        ).order_by(ChatMessageModel.created_at.asc()).all()

        chat_history = [{"role": msg.role, "content": msg.content} for msg in past_msgs[-6:]]

        # Process query through 4-agent coordinator
        response = coordinator.process_query(chat_req.query, df, chat_history=chat_history)

        if 'confidence_score' not in response:
            response['confidence_score'] = response.get('final_response', {}).get('confidence_score', 0.0)

        # Save user query & assistant response to DB
        user_id = current_user.id if current_user else "guest-user-id"
        db_user_msg = ChatMessageModel(
            session_id=chat_req.session_id,
            user_id=user_id,
            role="user",
            content=chat_req.query
        )
        db_assistant_msg = ChatMessageModel(
            session_id=chat_req.session_id,
            user_id=user_id,
            role="assistant",
            content=response.get('final_response', {}).get('text', 'Analysis complete.'),
            stats_json=json.dumps({"confidence_score": response.get('confidence_score', 0.0)})
        )
        db.add(db_user_msg)
        db.add(db_assistant_msg)
        db.commit()

        return JSONResponse(content=sanitize_for_json(response))

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat endpoint failed")
        return JSONResponse(
            status_code=500,
            content=sanitize_for_json({
                'query': chat_req.query,
                'timestamp': datetime.now().isoformat(),
                'agent_results': {},
                'final_response': {},
                'followup_questions': [],
                'confidence_score': 0.0,
                'error': str(e)
            })
        )

@app.get("/insights/{session_id}")
async def get_insights(session_id: str, db: DBSession = Depends(get_db)):
    try:
        df = load_dataframe_from_db(session_id, db)
        insights = coordinator.generate_insights(df)
        return JSONResponse(content=sanitize_for_json(insights))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}")
async def get_session_info(session_id: str, db: DBSession = Depends(get_db)):
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": db_session.id,
        "filename": db_session.filename,
        "uploaded_at": db_session.uploaded_at.isoformat(),
        "file_info": db_session.file_info
    }

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: DBSession = Depends(get_db)):
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if os.path.exists(db_session.file_path):
        try:
            os.remove(db_session.file_path)
        except Exception:
            pass

    db.delete(db_session)
    db.commit()
    return {"message": "Session deleted successfully"}

@app.get("/data/summary/{session_id}")
async def get_data_summary(session_id: str, db: DBSession = Depends(get_db)):
    try:
        df = load_dataframe_from_db(session_id, db)
        summary = file_handler.get_data_summary(df)
        return JSONResponse(content=sanitize_for_json(summary))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/data/sql")
@limiter.limit("15/minute")
async def execute_sql_query(
    request: Request,
    sql_req: SQLQueryRequest,
    db: DBSession = Depends(get_db)
):
    try:
        df = load_dataframe_from_db(sql_req.session_id, db)
        result = duckdb_engine.execute_query(sql_req.query, df=df, table_name="dataset")
        return JSONResponse(content=sanitize_for_json(result))
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=sanitize_for_json({"success": False, "query": sql_req.query, "error": str(e)})
        )

@app.get("/reports/pdf/{session_id}")
async def generate_pdf_report(session_id: str, db: DBSession = Depends(get_db)):
    try:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        df = load_dataframe_from_db(session_id, db)
        worker_kpis = coordinator.data_worker._calculate_business_kpis(df)
        
        pdf_bytes = pdf_generator.generate_pdf_report(
            filename=db_session.filename,
            kpis=worker_kpis,
            narrative="Automated Executive Intelligence Summary generated by AI Data Dashboard.",
            key_findings=[
                f"Total Orders processed: {worker_kpis.get('total_orders', 0):,}",
                f"Total Revenue generated: £{worker_kpis.get('total_revenue', 0.0):,.2f}",
                f"Average Order Value (AOV): £{worker_kpis.get('average_order_value', 0.0):,.2f}"
            ]
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Report_{db_session.filename}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/excel/{session_id}")
async def generate_excel_report(session_id: str, db: DBSession = Depends(get_db)):
    try:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        df = load_dataframe_from_db(session_id, db)
        worker_kpis = coordinator.data_worker._calculate_business_kpis(df)
        
        excel_bytes = excel_exporter.generate_excel_workbook(
            filename=db_session.filename,
            df=df,
            kpis=worker_kpis
        )
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=Analysis_{db_session.filename}.xlsx"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_prometheus_metrics():
    from utils.metrics import get_metrics_response
    return get_metrics_response()

@app.post("/upload/sample")
async def upload_sample_dataset(db: DBSession = Depends(get_db)):
    try:
        sample_path = os.path.join(os.path.dirname(__file__), "sample_data", "ecommerce_sales.csv")
        if not os.path.exists(sample_path):
            raise HTTPException(status_code=404, detail="Sample dataset not found")
        
        session_id = str(uuid.uuid4())
        filename = "ecommerce_sales_sample.csv"

        df, info = load_dataset(sample_path)

        # DB persistence
        db_session = SessionModel(
            id=session_id,
            filename=filename,
            user_id=None
        )
        db.add(db_session)
        db.commit()

        sessions[session_id] = df

        # Execute 4-Agent Insights
        initial_insights = coordinator.run_full_analysis(
            df=df,
            filename=filename,
            session_id=session_id
        )

        return {
            "session_id": session_id,
            "filename": filename,
            "info": info,
            "initial_insights": initial_insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/accounting/balance-sheet/{session_id}")
async def get_balance_sheet(session_id: str, db: DBSession = Depends(get_db)):
    try:
        df = load_dataframe_from_db(session_id, db)
        return coordinator.accountant.generate_balance_sheet(df)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/accounting/income-statement/{session_id}")
async def get_income_statement(session_id: str, db: DBSession = Depends(get_db)):
    try:
        df = load_dataframe_from_db(session_id, db)
        return coordinator.accountant.generate_income_statement(df)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/accounting/ratios/{session_id}")
async def get_financial_ratios(session_id: str, db: DBSession = Depends(get_db)):
    try:
        df = load_dataframe_from_db(session_id, db)
        return coordinator.accountant.calculate_ratios(df)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/accounting/mcp-tools")
async def get_accounting_mcp_tools():
    """Returns MCP (Model Context Protocol) tool definitions for external integration."""
    return {"tools": coordinator.accountant.get_mcp_tool_definitions()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
