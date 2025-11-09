## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]" httpx websockets
```

## Running the Server

```bash
fastapi dev server.py
```

The server will start on `http://localhost:8000`

## Using the Full Payload (Cursor)

1. **Copy the full payload**: Open `../injection/fullPayload.js` and copy its contents
2. **In Cursor**: Open DevTools (Help → Toggle Developer Tools)
3. **Paste in Console**: Paste the payload and press Enter
4. **Verify connection**: You should see:
   ```
   🚀 Cursor Mobile: found X existing message(s)
   👁️ Watching for new messages...
   🌐 Relay server: http://localhost:8000
   📝 Session ID: cursor-desktop-session
   ✅ WebSocket connected
   ✅ Sent via WebSocket: startup
   ```

## Using the CLI Client

### Interactive Mode (Streaming)
```bash
python cli_client.py
```

The CLI maintains a live WebSocket connection and streams ALL Cursor messages in real-time:
```
🔌 Connecting to WebSocket: ws://localhost:8000/ws/cursor-desktop-session
✅ WebSocket connected

💬 You: what is 2+2?
📤 You: what is 2+2?
🤖 Cursor: 2+2 equals 4.

💬 You: what is the capital of france?
📤 You: what is the capital of france?
🤖 Cursor: The capital of France is **Paris**.
```

**Note**: ALL messages from Cursor stream to CLI, even if triggered from Cursor itself!

### One-shot Mode
```bash
python cli_client.py "explain async/await in Python"
```

### Custom Server/Session
```bash
python cli_client.py --server http://192.168.1.100:8000 --session my-session "hello world"
```

### Commands
- `history` - View recent message history
- `exit` or `quit` - Exit the CLI
- Ctrl+C - Exit gracefully

## How It Works

1. **CLI Client** sends prompt to server via POST `/prompt`
2. **Server** stores prompt and pushes it to Cursor via WebSocket
3. **Cursor Payload** receives prompt, injects it into Cursor, waits for response
4. **Cursor** generates response
5. **Cursor Payload** detects response, sends back to server via WebSocket
6. **Server** stores response and makes it available to CLI client
7. **CLI Client** polls for response and displays it