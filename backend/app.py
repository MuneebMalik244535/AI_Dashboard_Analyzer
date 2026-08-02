from flask import Flask, render_template, request, jsonify, session
import os
import pandas as pd
from agents.planner_agent import PlannerAgent
from agents.data_worker_agent import DataWorkerAgent
from agents.chart_agent import ChartAgent
from agents.explainer_agent import ExplainerAgent
from utils.file_handler import FileHandler
from utils.agent_coordinator import AgentCoordinator

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize agents
coordinator = AgentCoordinator()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.csv'):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        # Load and store CSV data
        df = pd.read_csv(filepath)
        session['current_file'] = file.filename
        session['df_info'] = {
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.to_dict(),
            'head': df.head().to_dict('records')
        }
        
        return jsonify({
            'success': True,
            'filename': file.filename,
            'info': session['df_info']
        })
    
    return jsonify({'error': 'Please upload a CSV file'}), 400

@app.route('/chat', methods=['POST'])
def chat():
    user_query = request.json.get('query', '')
    
    if not user_query:
        return jsonify({'error': 'No query provided'}), 400
    
    if 'current_file' not in session:
        return jsonify({'error': 'No file uploaded'}), 400
    
    try:
        # Load current dataframe
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], session['current_file'])
        df = pd.read_csv(filepath)
        
        # Process query through agent system
        response = coordinator.process_query(user_query, df)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/insights')
def get_insights():
    if 'current_file' not in session:
        return jsonify({'error': 'No file uploaded'}), 400
    
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], session['current_file'])
        df = pd.read_csv(filepath)
        
        # Generate automatic insights
        insights = coordinator.generate_insights(df)
        
        return jsonify(insights)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
