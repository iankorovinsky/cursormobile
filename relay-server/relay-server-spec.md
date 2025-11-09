# Relay Server Specification

## Purpose
A minimal HTTP service that routes prompts and responses between a web client and a local agent (running on your laptop). It doesn't do any AI work itself—it just stores messages and streams them back out.

## Core Roles
- **Client** – sends prompts and listens for responses via WebSocket.
- **Agent** – fetches prompts, processes them, and posts back responses.
- **Session** – conversation identified by `session_id` (string). Each session maintains its own prompt store and subscriber list.

## Transport
- HTTP/1.1 REST endpoints
- WebSocket (WS/WSS) for bidirectional real-time communication with clients

---

## Data Models

### PromptMessage
```json
{
  "session_id": "string (required)",
  "client_msg_id": "string (required, unique per session)",
  "prompt": "string (required, max 128KB)",
  "metadata": "object (optional, arbitrary key-value pairs)",
  "ts": "number (optional, Unix timestamp in milliseconds, auto-set if missing)"
}
```

### AssistantMessage
```json
{
  "session_id": "string (required)",
  "assistant_msg_id": "string (required, unique per session, auto-generated if missing)",
  "client_msg_id": "string (required, references PromptMessage)",
  "text": "string (required, max 128KB)",
  "metadata": "object (optional, arbitrary key-value pairs)",
  "ts": "number (optional, Unix timestamp in milliseconds, auto-set if missing)"
}
```

### Error Response
```json
{
  "error": "string (required, human-readable error message)",
  "details": "string (optional, additional context)"
}
```

---

## API Endpoints

### 1. POST /prompt
Client submits a prompt for the agent to process.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "session_id": "string (required)",
    "prompt": "string (required)",
    "client_msg_id": "string (optional, auto-generated UUID if missing)",
    "metadata": "object (optional)"
  }
  ```

**Response:**
- `200 OK`: Prompt stored successfully
  ```json
  {
    "stored": true,
    "client_msg_id": "string (the ID used, generated or provided)"
  }
  ```
- `400 Bad Request`: Invalid request body or missing required fields

**Behavior:**
- If `client_msg_id` is missing, generate a UUID v4.
- If a prompt with the same `client_msg_id` already exists, return success (idempotency).
- Store the prompt in the session's prompt store.
- If no session exists, create it.

---

### 2. GET /prompts/{session_id}
Agent fetches prompts that haven't been responded to yet.

**Request:**
- Method: `GET`
- Path Parameter: `session_id` (string, required)
- Query Parameters:
  - `timeout`: number (optional, seconds to wait before returning empty array, default: 30, max: 300)
  - `wait`: boolean (optional, enable long-polling, default: true)

**Response:**
- `200 OK`: List of pending prompts
  ```json
  [
    {
      "session_id": "string",
      "client_msg_id": "string",
      "prompt": "string",
      "metadata": "object (optional)",
      "ts": "number"
    }
  ]
  ```
- `404 Not Found`: Session does not exist

**Behavior:**
- Return all prompts for the session that don't have a corresponding response yet.
- If `wait=true` (default), long-poll: wait up to `timeout` seconds for a new prompt to arrive before returning.
- If `wait=false`, return immediately with current pending prompts (empty array if none).
- Prompts are returned in chronological order (oldest first).
- Once a response is posted for a prompt, that prompt is no longer returned by this endpoint.

---

### 3. POST /response
Agent posts a generated response for a prompt.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "session_id": "string (required)",
    "client_msg_id": "string (required, must match a prompt)",
    "assistant_msg_id": "string (optional, auto-generated UUID if missing)",
    "text": "string (required)",
    "metadata": "object (optional)",
    "ts": "number (optional, Unix timestamp in milliseconds)"
  }
  ```

**Response:**
- `200 OK`: Response accepted and delivered
  ```json
  {
    "ok": true,
    "assistant_msg_id": "string (the ID used)",
    "delivered": true
  }
  ```
- `400 Bad Request`: Invalid request body or missing required fields
- `404 Not Found`: Session or `client_msg_id` not found
- `409 Conflict`: Response with same `assistant_msg_id` already exists (idempotency)

**Behavior:**
- If `assistant_msg_id` is missing, generate a UUID v4.
- If a response with the same `assistant_msg_id` already exists, return success (idempotency).
- Store the response and associate it with the `client_msg_id`.
- Immediately broadcast the response to all connected WebSocket clients for this session.
- Store the message in session history (if history is enabled).

---

### 4. WebSocket /ws/{session_id}
Clients connect via WebSocket to receive assistant messages in real-time.

**Connection:**
- Protocol: WebSocket (WS or WSS)
- Path: `/ws/{session_id}` where `session_id` is the session identifier
- Upgrade: HTTP request with `Upgrade: websocket` header

**Connection Response:**
- `101 Switching Protocols`: WebSocket connection established
- `400 Bad Request`: Invalid request or missing session_id
- `404 Not Found`: Session does not exist

**WebSocket Message Format:**

**Server to Client Messages:**
```json
{
  "type": "message",
  "data": <AssistantMessage>
}
```

```json
{
  "type": "ping",
  "ts": <number>
}
```

```json
{
  "type": "error",
  "error": "string",
  "details": "string"
}
```

**Client to Server Messages:**
Clients can optionally send ping messages:
```json
{
  "type": "pong",
  "ts": <number>
}
```

**Behavior:**
- Keep WebSocket connection open indefinitely.
- Server sends periodic ping messages every 30 seconds to keep connection alive.
- When a new assistant message arrives for this session, immediately send it to all connected WebSocket clients.
- If a client disconnects, remove it from the subscriber list.
- Multiple clients can connect to the same session simultaneously.
- Messages are delivered at least once (may be duplicated on reconnection).
- Clients should handle WebSocket close events and reconnect if needed.

---

### 5. GET /messages/{session_id}
Fetch stored message history for a session.

**Request:**
- Method: `GET`
- Path Parameter: `session_id` (string, required)
- Query Parameters:
  - `limit`: number (optional, max messages to return, default: 100, max: 1000)
  - `offset`: number (optional, pagination offset, default: 0)
  - `since`: number (optional, Unix timestamp in milliseconds, return messages after this time)

**Response:**
- `200 OK`: Message history
  ```json
  {
    "session_id": "string",
    "messages": [
      {
        "type": "prompt",
        "data": <PromptMessage>
      },
      {
        "type": "assistant",
        "data": <AssistantMessage>
      }
    ],
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
  ```
- `404 Not Found`: Session does not exist

**Behavior:**
- Return messages in chronological order (oldest first).
- Include both prompts and assistant responses.
- If history is not persisted (in-memory mode), return only messages currently in memory.

---

### 6. GET /healthz
Health check endpoint.

**Request:**
- Method: `GET`

**Response:**
- `200 OK`:
  ```json
  {
    "ok": true,
    "timestamp": "number (Unix timestamp in milliseconds)"
  }
  ```

---

## State Management

### In-Memory State (Default)
- `sessions`: `dict[str, Session]` (Python dictionary)
  - `prompts`: `dict[str, PromptMessage]` (all prompts for the session)
  - `responses`: `dict[str, AssistantMessage]` (responses keyed by client_msg_id)
  - `subscribers`: `set[WebSocket]` (clients connected via WebSocket)
  - `history`: `list[Message]` (optional, if history is enabled)

- `message_store`: `dict[str, list[Message]]` (for history, optional)

### Session Lifecycle
- Sessions are created automatically when first prompt is received.
- Sessions persist until explicitly deleted or server restart (in-memory mode).
- Sessions can be garbage collected if inactive for extended period (optional, e.g., 24 hours).

---

## Idempotency

### Client Message ID
- `client_msg_id` must be unique per session.
- If a prompt with the same `client_msg_id` is posted again, return success without creating a duplicate.
- Used to prevent duplicate prompts from being processed.

### Assistant Message ID
- `assistant_msg_id` must be unique per session.
- If a response with the same `assistant_msg_id` is posted again, return success without creating a duplicate.
- Used to prevent duplicate responses from being broadcast.

---

## Error Handling

### HTTP Status Codes
- `200 OK`: Success
- `400 Bad Request`: Invalid request body, missing required fields, or invalid data format
- `404 Not Found`: Session does not exist or resource not found
- `409 Conflict`: Duplicate message (idempotency conflict)
- `429 Too Many Requests`: Rate limit exceeded (optional, not required for MVP)
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Response Format
All errors return JSON:
```json
{
  "error": "Human-readable error message",
  "details": "Optional additional context or error code"
}
```

### Common Error Scenarios
- **Missing required field**: `400 Bad Request` with error message indicating missing field
- **Invalid session_id**: `404 Not Found` if session doesn't exist (for GET endpoints)
- **Invalid JSON**: `400 Bad Request` with error message "Invalid JSON"
- **Message too large**: `400 Bad Request` with error message "Message exceeds size limit"

---

## Reliability Guarantees

### Prompt Delivery
- Prompts are stored and available for the agent to fetch.
- Prompts remain available until a response is posted for them.

### Response Delivery
- Responses are delivered **at least once** to clients via WebSocket (may be duplicated on reconnection).
- Clients should handle duplicate messages using `assistant_msg_id`.

### Failure Behavior
- **Agent offline**: Prompts remain stored and available when agent reconnects.
- **Client offline**: Responses are lost (unless history is enabled and client fetches via `/messages`).
- **Server restart (in-memory mode)**: All stored prompts and responses are lost. Sessions are recreated on next request.
- **Network interruption**: WebSocket clients should handle reconnection logic (exponential backoff recommended).

---

## Example Flows

### Flow 1: Basic Prompt-Response Cycle
1. Client connects WebSocket to `/ws/abc`
2. Client POSTs `/prompt` with `{session_id: "abc", prompt: "Hello"}`
3. Server stores prompt, returns `{stored: true, client_msg_id: "msg-123"}`
4. Agent fetches `GET /prompts/abc?timeout=30`
5. Server returns prompt: `[{session_id: "abc", client_msg_id: "msg-123", prompt: "Hello", ts: 1234567890}]`
6. Agent processes prompt and POSTs `/response` with `{session_id: "abc", client_msg_id: "msg-123", text: "Hi there!"}`
7. Server broadcasts response to all WebSocket clients connected to `/ws/abc`
8. Client receives WebSocket message: `{"type":"message","data":{...}}`

### Flow 2: Multiple Clients
1. Client A and Client B both connect WebSocket to `/ws/session-xyz`
2. Client A POSTs `/prompt` with a prompt
3. Agent fetches prompts via `/prompts/session-xyz` and receives the prompt
4. Agent POSTs `/response`
5. Both Client A and Client B receive the response via WebSocket simultaneously

### Flow 3: Multiple Pending Prompts
1. Client sends 5 prompts rapidly to `/prompt`
2. Agent fetches `/prompts` and receives all 5 prompts in an array
3. Agent processes prompts one by one and POSTs `/response` for each
4. After each response, that prompt is no longer returned by `/prompts`
5. Agent fetches again and receives remaining pending prompts

---

## Implementation Notes

### Technology Stack (Python)
- **Runtime**: Python 3.10+
- **Framework**: FastAPI for HTTP server and WebSocket support
- **Language**: Python with type hints
- **WebSocket**: FastAPI's built-in `WebSocket` class (`from fastapi import WebSocket`)
- **In-memory storage**: Python `dict` and `set` data structures
- **UUID generation**: Python's `uuid` module (`uuid.uuid4()`)
- **Optional persistence**: Redis client (`redis` or `aioredis`) for multi-instance, SQLite (`aiosqlite`) for single-instance
- **ASGI server**: Uvicorn or Hypercorn for running FastAPI application

### Python Types
- Define Pydantic models for `PromptMessage`, `AssistantMessage`, `Session`, `ErrorResponse`
- Use Python `Enum` for message types and error codes where appropriate
- Leverage FastAPI's automatic request/response validation with Pydantic models
- Use type hints throughout the codebase for better IDE support and type checking

### Performance Considerations
- Use async/await for non-blocking I/O (FastAPI is async-native)
- WebSocket connections should be lightweight (one connection per client)
- Prompt lookups should be efficient (O(1) with `dict` data structure)
- Consider connection pooling for external storage (if used)
- WebSocket message broadcasting should be efficient (iterate over `set` of connections)
- Use `asyncio` for concurrent operations

### Testing Scenarios
1. Single client, single agent, one prompt-response cycle
2. Multiple clients receiving same response
3. Multiple pending prompts handled sequentially
4. Agent fetching all pending prompts at once
5. WebSocket reconnection and duplicate message handling
6. Concurrent prompts from multiple clients
7. Invalid requests (missing fields, wrong types)
8. Session creation and cleanup
9. WebSocket connection handling (open, close, error events)
10. WebSocket ping/pong keepalive mechanism

---

## Deployment

### Stateless Mode (Default)
- In-memory state only
- Suitable for single-instance deployment
- State lost on restart

### Persistent Mode (Optional)
- Redis or SQL backend for state persistence
- Enables multi-instance scaling
- Survives server restarts

### Hosting Options
- Fly.io, Render, Railway, VPS
- Docker containerization recommended (Python base image, e.g., `python:3.11-slim`)
- Environment variables for configuration
- Run with Uvicorn: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Use `requirements.txt` or `pyproject.toml` for dependency management

---

## Observability (Optional for MVP)

### Logging
- Structured logs (JSON format)
- Log levels: DEBUG, INFO, WARN, ERROR
- Key events: prompt stored, prompt fetched, response posted, client connected/disconnected

### Health Check
- `GET /healthz` returns `{ok: true}` if server is operational
- Can include additional health info (connection count) if needed

