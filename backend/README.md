# AI Data Dashboard - Multi-Agent Analytics Platform

A sophisticated AI-powered data analytics platform that uses a multi-agent framework to analyze CSV files and generate intelligent insights, visualizations, and natural language responses.

## 🤖 Multi-Agent Framework

The system uses 4 specialized agents that work together to provide comprehensive data analysis:

### 1. Planner Agent
- **Role**: Query Analysis & Planning
- **Function**: Breaks down user queries into structured steps
- **Features**: 
  - Detects query types (trends, comparisons, correlations, distributions)
  - Extracts relevant columns
  - Creates execution plans
  - Suggests follow-up questions

### 2. Data Worker Agent
- **Role**: Data Processing & Calculations
- **Function**: Performs actual data operations using pandas
- **Features**:
  - Statistical analysis (mean, median, std, percentiles)
  - Trend analysis with linear regression
  - Correlation analysis
  - Outlier detection (IQR, Z-score, DBSCAN)
  - Distribution analysis
  - Group-by operations

### 3. Chart Agent
- **Role**: Visualization & Charting
- **Function**: Creates appropriate visualizations using Plotly
- **Features**:
  - Line charts for trends
  - Bar charts for comparisons
  - Scatter plots for correlations
  - Heatmaps for correlation matrices
  - Histograms for distributions
  - Box plots for outliers
  - Area charts for cumulative trends
  - Pie charts for categorical data

### 4. Explainer Agent
- **Role**: Insight Generation & Communication
- **Function**: Converts raw data into human-readable insights
- **Features**:
  - Natural language explanations
  - Key findings extraction
  - Data quality assessment
  - Actionable recommendations
  - Narrative summaries

## 🚀 Features

### Core Functionality
- **CSV File Upload**: Drag-and-drop or click to upload CSV files
- **Natural Language Queries**: Ask questions about your data in plain English
- **Automatic Insights**: Get instant analysis when you upload a file
- **Interactive Charts**: Dynamic, interactive visualizations
- **Multi-Agent Pipeline**: Watch agents work together in real-time

### Query Examples
- "Show me the trend of sales over time"
- "What are the correlations between price and quantity?"
- "Compare performance across different categories"
- "Are there any outliers in the revenue data?"
- "Give me a summary of customer demographics"

### Analysis Types
- **Trend Analysis**: Identify patterns over time
- **Comparison Analysis**: Compare groups and categories
- **Correlation Analysis**: Find relationships between variables
- **Distribution Analysis**: Understand data spread and shape
- **Outlier Detection**: Identify unusual data points
- **Summary Statistics**: Get comprehensive data overview

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- pip or uv package manager

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd AI_Data_Dashboard
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

Or using uv:
```bash
uv pip install -r requirements.txt
```

3. **Run the application**
```bash
python app.py
```

4. **Access the dashboard**
Open your browser and go to `http://localhost:5000`

## 📁 Project Structure

```
AI_Data_Dashboard/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── agents/               # Multi-agent framework
│   ├── __init__.py
│   ├── planner_agent.py      # Query analysis & planning
│   ├── data_worker_agent.py  # Data processing & calculations
│   ├── chart_agent.py        # Visualization & charting
│   └── explainer_agent.py    # Insight generation
├── utils/                # Utility modules
│   ├── __init__.py
│   ├── agent_coordinator.py  # Agent coordination system
│   └── file_handler.py       # File processing utilities
├── templates/            # HTML templates
│   └── index.html       # Main dashboard interface
└── uploads/             # File upload directory
```

## 🎯 Usage Guide

### 1. Upload Your Data
- Click the upload area or drag-and-drop a CSV file
- Supported formats: CSV (up to 16MB)
- Automatic data cleaning and preprocessing

### 2. Ask Questions
- Type questions in natural language
- Examples: "What are the trends in revenue?", "Compare sales by region"
- Get instant responses with insights and visualizations

### 3. Explore Insights
- View automatically generated insights
- Interactive charts and visualizations
- Follow-up question suggestions
- Data quality assessment

### 4. Agent Pipeline
- Watch the multi-agent system work
- Real-time status updates
- Confidence scores for analysis

## 🔧 Configuration

### Environment Variables
Create a `.env` file for configuration:
```env
FLASK_ENV=development
FLASK_DEBUG=True
MAX_FILE_SIZE=16777216  # 16MB in bytes
```

### Customization
- Modify agent behavior in `agents/` directory
- Add new chart types in `chart_agent.py`
- Customize insight templates in `explainer_agent.py`

## 📊 Supported Analysis Types

### Statistical Analysis
- Descriptive statistics (mean, median, mode, std, variance)
- Percentiles and quartiles
- Data distribution analysis
- Normality testing

### Advanced Analytics
- Linear regression for trends
- Correlation analysis (Pearson, Spearman)
- Outlier detection (multiple methods)
- Clustering with DBSCAN
- Time series analysis

### Visualizations
- Line charts (trends over time)
- Bar charts (comparisons)
- Scatter plots (correlations)
- Heatmaps (correlation matrices)
- Histograms (distributions)
- Box plots (outliers and quartiles)
- Area charts (cumulative trends)
- Pie charts (categorical breakdowns)

## 🚀 Advanced Features

### Agent Coordination
- Intelligent pipeline optimization
- Parallel agent execution when possible
- Error handling and fallback mechanisms
- Confidence scoring for analysis quality

### Data Quality
- Automatic missing value detection
- Duplicate identification
- Data type inference
- Outlier flagging
- Completeness scoring

### Smart Recommendations
- Follow-up question suggestions
- Data cleaning recommendations
- Analysis suggestions based on data characteristics
- Chart type recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**File Upload Errors**
- Check file format (CSV only)
- Verify file size (< 16MB)
- Ensure file is not corrupted

**Analysis Errors**
- Verify data contains numeric columns for statistical analysis
- Check for sufficient data points (minimum 3 rows recommended)
- Ensure column names are descriptive

**Chart Display Issues**
- Check browser console for JavaScript errors
- Verify Plotly library loaded correctly
- Ensure data is in correct format

**Performance Issues**
- Large files may take longer to process
- Consider sampling large datasets
- Monitor memory usage with big files

### Getting Help
- Check the console for error messages
- Verify all dependencies are installed
- Ensure Flask server is running properly
- Contact support for persistent issues

## 🔄 Updates & Future Features

### Planned Enhancements
- Support for Excel files (.xlsx)
- Additional chart types (3D plots, geographic maps)
- Machine learning predictions
- Real-time data streaming
- Export functionality (PDF, PNG, Excel)
- User authentication and data persistence
- API endpoints for programmatic access
- Custom agent creation framework

### Version History
- v1.0.0: Initial release with core multi-agent framework
- v1.1.0: Enhanced visualizations and UI improvements
- v1.2.0: Advanced analytics and ML capabilities (planned)

## 📚 Technical Documentation

### Agent Communication
Agents communicate through structured JSON messages:
```python
{
    "agent": "planner",
    "action": "analyze_query",
    "data": {...},
    "metadata": {...}
}
```

### Data Processing Pipeline
1. **File Upload** → Validation & Cleaning
2. **Query Analysis** → Planning Agent
3. **Data Processing** → Worker Agent
4. **Visualization** → Chart Agent
5. **Insight Generation** → Explainer Agent
6. **Response Assembly** → Coordinator

### Error Handling
- Graceful degradation when agents fail
- Fallback to simpler analysis methods
- User-friendly error messages
- Automatic retry mechanisms

---

**Built with ❤️ using Flask, Plotly, and a Multi-Agent AI Framework**
