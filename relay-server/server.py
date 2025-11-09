"""Relay server implementation based on relay-server-spec.md."""
from __future__ import annotations

import asyncio
import contextlib
import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional, Set, Union

from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, FieldValidationInfo, field_validator


app = FastAPI(title="Relay Server", version="0.1.0")

# Enable CORS for all origins (including vscode-file://)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_MESSAGE_BYTES = 128 * 1024
DEFAULT_PROMPT_TIMEOUT = 30
MAX_PROMPT_TIMEOUT = 300
PING_INTERVAL_SECONDS = 30
MAX_HISTORY_LIMIT = 1000
DEFAULT_HISTORY_LIMIT = 100


def current_timestamp_ms() -> int:
    return int(time.time() * 1000)


def ensure_message_size(value: str, field_name: str) -> None:
    if len(value.encode("utf-8")) > MAX_MESSAGE_BYTES:
        raise_http_error(
            status.HTTP_400_BAD_REQUEST,
            "Message exceeds size limit",
            f"{field_name} exceeds {MAX_MESSAGE_BYTES} bytes",
        )


def normalize_optional_id(value: Optional[str], field_name: str) -> Optional[str]:
    if value is None:
        return None
    trimmed = value.strip()
    if not trimmed:
        raise_http_error(
            status.HTTP_400_BAD_REQUEST,
            "Missing required field",
            f"{field_name} cannot be empty",
        )
    return trimmed


def raise_http_error(code: int, message: str, details: Optional[str] = None) -> None:
    raise HTTPException(status_code=code, detail={"error": message, "details": details})


class PromptPayload(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    prompt: str = Field(..., description="Prompt text")
    client_msg_id: Optional[str] = Field(None, description="Client message identifier")
    metadata: Optional[Dict[str, Any]] = Field(default=None)

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("session_id cannot be empty")
        return value.strip()

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("prompt cannot be empty")
        return value

    @field_validator("client_msg_id")
    @classmethod
    def validate_client_msg_id(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not value.strip():
            raise ValueError("client_msg_id cannot be empty")
        return value.strip()


class ResponsePayload(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    client_msg_id: str = Field(..., description="Client message identifier")
    assistant_msg_id: Optional[str] = Field(None, description="Assistant message identifier")
    text: str = Field(..., description="Assistant response text")
    metadata: Optional[Dict[str, Any]] = Field(default=None)
    ts: Optional[int] = Field(default=None, ge=0)

    @field_validator("session_id", "client_msg_id")
    @classmethod
    def validate_ids(cls, value: str, info: FieldValidationInfo) -> str:
        if not value or not value.strip():
            raise ValueError(f"{info.field_name} cannot be empty")
        return value.strip()

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        if not value:
            raise ValueError("text cannot be empty")
        return value


class PromptMessage(BaseModel):
    session_id: str
    client_msg_id: str
    prompt: str
    metadata: Optional[Dict[str, Any]] = None
    ts: int


class AssistantMessage(BaseModel):
    session_id: str
    assistant_msg_id: str
    client_msg_id: str
    text: str
    metadata: Optional[Dict[str, Any]] = None
    ts: int


@dataclass
class HistoryEntry:
    type: Literal["prompt", "assistant"]
    data: Union[PromptMessage, AssistantMessage]


@dataclass
class SessionState:
    session_id: str
    prompts: Dict[str, PromptMessage] = field(default_factory=dict)
    responses_by_client: Dict[str, AssistantMessage] = field(default_factory=dict)
    responses_by_assistant: Dict[str, AssistantMessage] = field(default_factory=dict)
    subscribers: Set[WebSocket] = field(default_factory=set)
    history: List[HistoryEntry] = field(default_factory=list)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    def __post_init__(self) -> None:
        self.condition = asyncio.Condition(self.lock)


sessions: Dict[str, SessionState] = {}
sessions_lock = asyncio.Lock()


async def get_session(session_id: str, create: bool = False) -> SessionState:
    session = sessions.get(session_id)
    if session:
        return session
    if not create:
        raise_http_error(status.HTTP_404_NOT_FOUND, "Session not found", session_id)
    async with sessions_lock:
        session = sessions.get(session_id)
        if session:
            return session
        session = SessionState(session_id=session_id)
        sessions[session_id] = session
        return session


def pending_prompts_locked(session: SessionState) -> List[PromptMessage]:
    return [
        prompt
        for prompt in session.prompts.values()
        if prompt.client_msg_id not in session.responses_by_client
    ]


async def broadcast_response(session: SessionState, message: AssistantMessage) -> None:
    # Copy subscribers while the lock is held to avoid race conditions.
    async with session.lock:
        subscribers = list(session.subscribers)
    message_payload = {"type": "message", "data": message.dict()}
    stale: List[WebSocket] = []
    for ws in subscribers:
        try:
            await ws.send_json(message_payload)
        except RuntimeError:
            stale.append(ws)
        except WebSocketDisconnect:
            stale.append(ws)
    if stale:
        async with session.lock:
            for ws in stale:
                session.subscribers.discard(ws)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        error = detail.get("error") or "Error"
        details = detail.get("details")
    else:
        error = detail or "Error"
        details = None
    return JSONResponse(status_code=exc.status_code, content={"error": error, "details": details})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "Invalid request body", "details": exc.errors()},
    )

@app.get("/")
async def root() -> Dict[str, Any]:
    return {"message": "Hello, World!"}

@app.post("/prompt")
async def create_prompt(payload: PromptPayload) -> Dict[str, Any]:
    session_id = payload.session_id
    ensure_message_size(payload.prompt, "prompt")
    client_msg_id = normalize_optional_id(payload.client_msg_id, "client_msg_id") or str(
        uuid.uuid4()
    )
    session = await get_session(session_id, create=True)
    async with session.lock:
        if client_msg_id in session.prompts:
            return {"stored": True, "client_msg_id": client_msg_id}
        ts = current_timestamp_ms()
        prompt_message = PromptMessage(
            session_id=session_id,
            client_msg_id=client_msg_id,
            prompt=payload.prompt,
            metadata=payload.metadata,
            ts=ts,
        )
        session.prompts[client_msg_id] = prompt_message
        session.history.append(HistoryEntry(type="prompt", data=prompt_message))
        session.condition.notify_all()
    return {"stored": True, "client_msg_id": client_msg_id}


@app.get("/prompts/{session_id}")
async def fetch_prompts(
    session_id: str,
    timeout: int = Query(DEFAULT_PROMPT_TIMEOUT, ge=0, le=MAX_PROMPT_TIMEOUT),
    wait: bool = Query(True),
) -> List[Dict[str, Any]]:
    session = sessions.get(session_id)
    if not session:
        raise_http_error(status.HTTP_404_NOT_FOUND, "Session not found", session_id)
    loop = asyncio.get_running_loop()
    async with session.condition:
        pending = pending_prompts_locked(session)
        if pending or not wait or timeout == 0:
            return [prompt.dict() for prompt in sorted(pending, key=lambda p: p.ts)]
        deadline = loop.time() + timeout
        while True:
            remaining = deadline - loop.time()
            if remaining <= 0:
                return []
            try:
                await asyncio.wait_for(session.condition.wait(), timeout=remaining)
            except asyncio.TimeoutError:
                return []
            pending = pending_prompts_locked(session)
            if pending:
                return [prompt.dict() for prompt in sorted(pending, key=lambda p: p.ts)]


@app.post("/response")
async def create_response(payload: ResponsePayload) -> Dict[str, Any]:
    print(f"\n{'='*60}")
    print(f"📨 RECEIVED MESSAGE")
    print(f"{'='*60}")
    print(f"Session ID: {payload.session_id}")
    print(f"Client Msg ID: {payload.client_msg_id}")
    print(f"Text: {payload.text[:200]}{'...' if len(payload.text) > 200 else ''}")
    if payload.metadata:
        print(f"Metadata: {payload.metadata}")
    print(f"{'='*60}\n")
    
    ensure_message_size(payload.text, "text")
    assistant_msg_id = normalize_optional_id(
        payload.assistant_msg_id, "assistant_msg_id"
    ) or str(uuid.uuid4())
    
    # Auto-create session if it doesn't exist (for standalone messages)
    session = await get_session(payload.session_id, create=True)
    
    async with session.lock:
        prompt = session.prompts.get(payload.client_msg_id)
        # Allow messages without prompts (for monitoring/connection messages)
        if not prompt:
            print(f"⚠️  No matching prompt found for client_msg_id: {payload.client_msg_id}")
            print(f"   Creating standalone message entry...")
            # Store it anyway as a standalone response
            pass
        if assistant_msg_id in session.responses_by_assistant:
            return {"ok": True, "assistant_msg_id": assistant_msg_id, "delivered": True}
        
        # Allow duplicate client_msg_id if no prompt exists (for monitoring messages)
        if payload.client_msg_id in session.responses_by_client and prompt:
            raise_http_error(
                status.HTTP_409_CONFLICT,
                "Response already exists for client_msg_id",
                payload.client_msg_id,
            )
        ts = payload.ts or current_timestamp_ms()
        assistant_message = AssistantMessage(
            session_id=payload.session_id,
            assistant_msg_id=assistant_msg_id,
            client_msg_id=payload.client_msg_id,
            text=payload.text,
            metadata=payload.metadata,
            ts=ts,
        )
        session.responses_by_client[payload.client_msg_id] = assistant_message
        session.responses_by_assistant[assistant_msg_id] = assistant_message
        session.history.append(HistoryEntry(type="assistant", data=assistant_message))
    await broadcast_response(session, assistant_message)
    return {"ok": True, "assistant_msg_id": assistant_msg_id, "delivered": True}


async def websocket_pinger(websocket: WebSocket) -> None:
    try:
        while True:
            await asyncio.sleep(PING_INTERVAL_SECONDS)
            await websocket.send_json({"type": "ping", "ts": current_timestamp_ms()})
    except (RuntimeError, WebSocketDisconnect):
        return


@app.websocket("/ws/{session_id}")
async def session_websocket(websocket: WebSocket, session_id: str) -> None:
    session = sessions.get(session_id)
    if not session:
        await websocket.close(code=4404, reason="Session not found")
        return
    await websocket.accept()
    async with session.lock:
        session.subscribers.add(websocket)
    ping_task = asyncio.create_task(websocket_pinger(websocket))
    try:
        while True:
            try:
                message = await websocket.receive_text()
            except WebSocketDisconnect:
                break
            if not message:
                continue
            try:
                payload = json.loads(message)
            except json.JSONDecodeError:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": "Invalid JSON",
                        "details": "WebSocket payload must be valid JSON",
                    }
                )
                continue
            if payload.get("type") == "pong":
                continue
            await websocket.send_json(
                {
                    "type": "error",
                    "error": "Unsupported message type",
                    "details": "Only pong messages are accepted",
                }
            )
    finally:
        ping_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await ping_task
        async with session.lock:
            session.subscribers.discard(websocket)


@app.get("/messages/{session_id}")
async def get_messages(
    session_id: str,
    limit: int = Query(DEFAULT_HISTORY_LIMIT, ge=1, le=MAX_HISTORY_LIMIT),
    offset: int = Query(0, ge=0),
    since: Optional[int] = Query(None, ge=0),
) -> Dict[str, Any]:
    session = sessions.get(session_id)
    if not session:
        raise_http_error(status.HTTP_404_NOT_FOUND, "Session not found", session_id)
    async with session.lock:
        history_snapshot = list(session.history)
    if since is not None:
        history_snapshot = [h for h in history_snapshot if h.data.ts > since]
    total = len(history_snapshot)
    sliced = history_snapshot[offset : offset + limit]
    messages = [
        {
            "type": entry.type,
            "data": entry.data.dict(),
        }
        for entry in sliced
    ]
    return {
        "session_id": session_id,
        "messages": messages,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/healthz")
async def healthz() -> Dict[str, Any]:
    return {"ok": True, "timestamp": current_timestamp_ms()}
