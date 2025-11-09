## Running the Application

```
python3 -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]"
fastapi dev server.py
```

## Request Shape

```
response = requests.post(
    "http://localhost:8000/response",
    json={
        "session_id": "your-session-id",
        "client_msg_id": "the-client-msg-id-from-prompt",
        "text": """your text content here
        can be multi-line
        like file content""",
        "metadata": {"source": "server.py"}
    }
)
```