# Cursor Mobile - Quick Start Guide

Control Cursor from anywhere via WebSocket!

## 🚀 Quick Setup (5 minutes)

### 1. Start the Relay Server

```bash
cd relay-server
python3 -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]" httpx websockets
fastapi dev server.py
```

Server should be running at `http://localhost:8000`

### 2. Inject Payload into Cursor

1. Open Cursor
2. Open DevTools: **Help → Toggle Developer Tools**
3. Go to **Console** tab
4. Copy the entire contents of `injection/fullPayload.js`
5. Paste into console and press Enter

You should see:
```
🚀 Cursor Mobile: found X existing message(s)
👁️ Watching for new messages...
🌐 Relay server: http://localhost:8000
📝 Session ID: cursor-desktop-session
🔌 Connecting to WebSocket...
✅ WebSocket connected
✅ Sent via WebSocket: startup
```

### 3. Test with CLI Client

In a new terminal:

```bash
cd relay-server
source .venv/bin/activate
python cli_client.py
```

Type a prompt:
```
💬 You: what is 2+2?
```

Watch the magic - **FULL BIDIRECTIONAL STREAMING**:
- CLI maintains live WebSocket connection to server
- You type in CLI → Server → Cursor (via WebSocket injection)
- Cursor responds → Server → CLI (streamed instantly)
- **BONUS**: Type directly in Cursor and watch it stream to CLI too!

All messages flow continuously in real-time. The CLI is like a remote terminal for Cursor.

## 📁 File Structure

```
cursormobile/
├── injection/
│   ├── fullPayload.js      # Main payload (WebSocket + monitoring)
│   ├── payload.js           # Original monitoring only
│   └── InjectAndSend.js     # Original injection only
├── relay-server/
│   ├── server.py            # FastAPI relay server
│   ├── cli_client.py        # Python CLI client
│   └── README.md            # Detailed docs
└── QUICKSTART.md            # This file
```

## 🎮 Usage Examples

### Interactive Mode (Recommended)
```bash
python cli_client.py
💬 You: explain recursion in simple terms
💬 You: history        # View chat history
💬 You: exit          # Quit
```

### One-shot Command
```bash
python cli_client.py "write a hello world in Rust"
```

### Custom Session
```bash
python cli_client.py --session "my-project" "refactor the main function"
```

## 🔧 Troubleshooting

### WebSocket won't connect
- Make sure server is running
- Check Cursor DevTools console for errors
- Try reloading the payload

### Prompts not reaching Cursor
- Verify WebSocket is connected (green ✅ in console)
- Check server terminal for "📤 Sent prompt to WebSocket"
- Reload fullPayload.js if needed

### Responses not returning
- Check if Cursor is actually generating a response
- Look for "🔔 NEW MESSAGE" in Cursor console
- Verify 2-second stabilization window has passed

### CORS Errors
- Server should have CORS middleware enabled
- Check `relay-server/server.py` has `CORSMiddleware`
- Restart server after any changes

## 🎯 Next Steps

- **Mobile App**: Build iOS/Android app using the same WebSocket protocol
- **Web Interface**: Create a web UI instead of CLI
- **Multi-Session**: Support multiple Cursor instances simultaneously
- **Streaming**: Stream responses as they're generated instead of waiting

## 📝 Notes

- Session ID defaults to `cursor-desktop-session`
- Messages stabilize after 2 seconds of no changes
- WebSocket auto-reconnects every 5 seconds if disconnected
- Server pings every 30 seconds to keep connection alive

## 🐛 Development

### Reload Payload Without Restarting
Just paste the full payload again - it cleans up previous instances automatically.

### View All Messages
In Cursor console:
```javascript
window.cursorMessages  // Array of all messages
```

### Configure Relay
In Cursor console:
```javascript
window.configureCursorRelay({
  sessionId: 'my-custom-session',
  serverUrl: 'http://192.168.1.100:8000',
  wsUrl: 'ws://192.168.1.100:8000'
})
```

### Manual Injection Test
In Cursor console:
```javascript
await window.sendPromptToCursor("test message")
```

---

**Happy hacking!** 🎉

