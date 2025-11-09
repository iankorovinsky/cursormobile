# WebSocket Integration Guide

This document explains how the frontend connects to the relay server via WebSocket for real-time chat functionality.

## Architecture Overview

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│                 │◄──────────────────►│                  │
│   Frontend      │                    │  Relay Server    │
│   (Next.js)     │     HTTP POST      │   (FastAPI)      │
│                 │◄──────────────────►│                  │
└─────────────────┘                    └──────────────────┘
```

### Components

1. **Frontend WebSocket Hook** (`frontend/app/hooks/useWebSocket.ts`)
   - Manages WebSocket connection lifecycle
   - Sends prompts via HTTP POST to `/prompt`
   - Receives responses via WebSocket at `/ws/{session_id}`
   - Auto-reconnects on disconnect
   - Handles message state management

2. **Relay Server** (`relay-server/server.py`)
   - FastAPI-based WebSocket server
   - Stores messages in-memory per session
   - Broadcasts responses to all connected clients
   - Supports long-polling for agents

3. **React Components**
   - `ChatInterface.tsx`: Main component managing WebSocket connection
   - `ChatInput.tsx`: Sends messages via the hook
   - `ChatMessages.tsx`: Displays real-time messages

## Message Flow

### Sending a Message (User → Cursor)

1. User types message in `ChatInput`
2. `ChatInput` calls `handleSendMessage(text)`
3. `useWebSocket` hook sends HTTP POST to `/prompt` endpoint
4. Message is optimistically added to UI
5. Server stores prompt and broadcasts to all WebSocket subscribers
6. Cursor desktop (if connected) receives prompt via WebSocket

### Receiving a Response (Cursor → User)

1. Cursor desktop processes prompt and sends response via WebSocket
2. Server receives response via WebSocket message type "response"
3. Server stores response and broadcasts to all connected clients
4. Frontend WebSocket receives message with type "message"
5. `useWebSocket` hook adds message to state
6. `ChatMessages` component displays the response

## Setup Instructions

### 1. Start the Relay Server

```bash
cd relay-server

# Create virtual environment (first time only)
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies (first time only)
pip install "fastapi[standard]" httpx websockets

# Run the server
fastapi dev server.py
```

The server will start on `http://localhost:8000`

### 2. Configure Frontend Environment

Create `.env.local` in the `frontend` directory:

```env
NEXT_PUBLIC_RELAY_SERVER_URL=ws://localhost:8000
```

### 3. Start the Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Run the development server
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Test the Integration

#### Option A: Frontend to Frontend

1. Open two browser tabs to `http://localhost:3000/chat`
2. Send a message from one tab
3. You should see the message appear in both tabs (prompts are synced)

#### Option B: Frontend to Cursor Desktop

1. Start the relay server
2. Open Cursor IDE
3. In Cursor DevTools (Help → Toggle Developer Tools), paste the payload from `injection/fullPayload.js`
4. Open frontend at `http://localhost:3000/chat`
5. Send a message from the frontend
6. Cursor should receive the prompt and respond
7. The response appears in the frontend

#### Option C: CLI Client Test

```bash
cd relay-server
python cli_client.py
```

Type messages in the CLI and they'll be sent to the relay server.

## API Reference

### WebSocket Hook API

```typescript
const { messages, sendMessage, isConnected, error, clearMessages } = useWebSocket({
  sessionId: 'cursor-mobile-session',
  serverUrl: 'ws://localhost:8000', // Optional, defaults to env var
  onMessage: (message) => console.log('New message:', message),
  onError: (error) => console.error('Error:', error),
  reconnectInterval: 3000, // Optional, milliseconds
});
```

**Return Values:**
- `messages`: Array of messages (prompts and responses)
- `sendMessage(text, metadata?)`: Function to send a message
- `isConnected`: Boolean indicating WebSocket connection status
- `error`: Error object if connection fails
- `clearMessages()`: Function to clear all messages

**Message Type:**
```typescript
interface Message {
  id: string;
  type: 'prompt' | 'assistant';
  text: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

### Relay Server Endpoints

**WebSocket Connection:**
- `ws://localhost:8000/ws/{session_id}`
- Receives real-time messages
- Sends ping/pong for keepalive

**HTTP Endpoints:**
- `POST /prompt` - Send a prompt
- `POST /response` - Send a response (usually from Cursor)
- `GET /prompts/{session_id}` - Fetch pending prompts (long-polling)
- `GET /messages/{session_id}` - Fetch message history
- `GET /healthz` - Health check

## Connection Status Indicator

The frontend displays a connection status indicator in the header:
- 🟢 Green dot: Connected to relay server
- 🔴 Red dot: Disconnected
- ⚠️ Warning icon: Connection error (hover for details)

The send button is disabled when disconnected.

## Troubleshooting

### WebSocket connection fails

**Error:** `WebSocket connection to 'ws://localhost:8000/ws/...' failed`

**Solutions:**
1. Ensure relay server is running: `cd relay-server && fastapi dev server.py`
2. Check server is listening on port 8000
3. Verify no firewall blocking port 8000
4. Check browser console for detailed error messages

### Messages not appearing

**Issue:** Messages sent but not appearing in UI

**Solutions:**
1. Check WebSocket connection status indicator (should be green)
2. Open browser DevTools → Network → WS to inspect WebSocket messages
3. Check relay server logs for incoming messages
4. Verify session IDs match between sender and receiver

### CORS errors

**Error:** `Access to fetch at 'http://localhost:8000/prompt' from origin 'http://localhost:3000' has been blocked by CORS`

**Solution:** The relay server has CORS enabled for all origins. If you still see this error:
1. Ensure relay server is running the latest code
2. Check that `CORSMiddleware` is configured in `server.py`
3. Try restarting the relay server

### Auto-reconnect not working

**Issue:** WebSocket disconnects and doesn't reconnect

**Solutions:**
1. Check browser console for reconnection attempts
2. Verify `reconnectInterval` is set (default: 3000ms)
3. Check if `shouldReconnectRef.current` is true
4. Ensure component hasn't unmounted

## Production Deployment

### Frontend

Update `.env.local` or `.env.production`:
```env
NEXT_PUBLIC_RELAY_SERVER_URL=wss://your-relay-server.com
```

Note: Use `wss://` (WebSocket Secure) for HTTPS domains.

### Relay Server

The relay server can be deployed to:
- Fly.io
- Render
- Railway
- Any VPS with Python support

**Requirements:**
- Python 3.10+
- FastAPI with uvicorn
- WebSocket support
- HTTPS/WSS for production

**Deployment command:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

## Next Steps

1. **Session Management**: Implement unique session IDs per chat conversation
2. **Persistence**: Add database storage for message history
3. **Authentication**: Integrate Auth0 for secure sessions
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Message Formatting**: Support markdown, code blocks, and rich content
6. **Typing Indicators**: Show when Cursor is processing a response
7. **Read Receipts**: Track message delivery and read status

## References

- Relay Server Specification: `relay-server/relay-server-spec.md`
- Relay Server README: `relay-server/README.md`
- WebSocket Hook: `frontend/app/hooks/useWebSocket.ts`
- Test Guide: `TEST_GUIDE.md`
