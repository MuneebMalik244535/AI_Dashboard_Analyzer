import pytest
import io

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_upload_and_chat_flow(client):
    csv_content = (
        "Transaction_ID,Date,Store_Location,Revenue,Units_Sold,Product_Category\n"
        "1,2024-01-01,London,100.0,2,Electronics\n"
        "2,2024-01-02,Leeds,200.0,4,Clothing\n"
        "3,2024-01-03,Manchester,150.0,3,Groceries\n"
    )
    
    # Upload File
    files = {"file": ("test_sales.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = client.post("/upload", files=files)
    assert upload_res.status_code == 200
    res_data = upload_res.json()
    assert res_data["success"] is True
    session_id = res_data["session_id"]
    assert session_id != ""

    # Send Chat Query
    chat_res = client.post("/chat", json={
        "query": "What is the total revenue?",
        "session_id": session_id
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "final_response" in chat_data
    assert chat_data["confidence_score"] > 0.0

    # Get Data Summary
    summary_res = client.get(f"/data/summary/{session_id}")
    assert summary_res.status_code == 200
    assert summary_res.json()["basic_info"]["rows"] == 3
