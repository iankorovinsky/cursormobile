#!/usr/bin/env python3
"""Simple CLI client to interact with Cursor via relay server."""

import asyncio
import json
import sys
from typing import Optional

import httpx
import websockets


class CursorClient:
    def __init__(self, server_url: str = "http://localhost:8000", session_id: str = "cursor-desktop-session"):
        self.server_url = server_url
        self.session_id = session_id
        self.client = httpx.AsyncClient(timeout=180.0)
        self.ws = None
        self.ws_url = server_url.replace("http://", "ws://").replace("https://", "wss://")
        self.message_queue = asyncio.Queue()
        self.pending_responses = {}  # client_msg_id -> asyncio.Future
    
    async def connect_websocket(self):
        """Connect to WebSocket and handle incoming messages."""
        ws_url = f"{self.ws_url}/ws/{self.session_id}"
        print(f"🔌 Connecting to WebSocket: {ws_url}")
        
        try:
            async with websockets.connect(ws_url) as websocket:
                self.ws = websocket
                print(f"✅ WebSocket connected\n")
                
                # Listen for messages
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        await self.handle_ws_message(data)
                    except json.JSONDecodeError:
                        print(f"⚠️  Invalid JSON from server: {message}")
                    except Exception as e:
                        print(f"❌ Error handling message: {e}")
        except websockets.exceptions.WebSocketException as e:
            print(f"❌ WebSocket error: {e}")
            self.ws = None
        except Exception as e:
            print(f"❌ Connection error: {e}")
            self.ws = None
    
    async def handle_ws_message(self, data: dict):
        """Handle incoming WebSocket messages."""
        msg_type = data.get("type")
        
        if msg_type == "ping":
            # Respond to ping
            await self.ws.send(json.dumps({"type": "pong", "ts": data.get("ts")}))
            return
        
        if msg_type == "message":
            # Incoming message from Cursor
            msg_data = data.get("data", {})
            client_msg_id = msg_data.get("client_msg_id")
            text = msg_data.get("text", "")
            
            # Print the message
            print(f"\n🤖 Cursor: {text}")
            
            # If this is a response to a pending prompt, resolve it
            if client_msg_id and client_msg_id in self.pending_responses:
                future = self.pending_responses.pop(client_msg_id)
                if not future.done():
                    future.set_result(msg_data)
            
            return
        
        if msg_type == "ack":
            # Acknowledgment of sent response
            return
        
        if msg_type == "error":
            print(f"❌ Server error: {data.get('error')} - {data.get('details')}")
            return
    
    async def send_prompt(self, prompt: str, metadata: Optional[dict] = None) -> dict:
        """Send a prompt to Cursor and wait for response via WebSocket."""
        print(f"\n📤 You: {prompt}")
        
        # Send prompt via HTTP
        response = await self.client.post(
            f"{self.server_url}/prompt",
            json={
                "session_id": self.session_id,
                "prompt": prompt,
                "metadata": metadata or {}
            }
        )
        response.raise_for_status()
        result = response.json()
        client_msg_id = result["client_msg_id"]
        
        # Create a future to wait for the response
        future = asyncio.Future()
        self.pending_responses[client_msg_id] = future
        
        try:
            # Wait for response with timeout
            response_data = await asyncio.wait_for(future, timeout=120.0)
            return response_data
        except asyncio.TimeoutError:
            self.pending_responses.pop(client_msg_id, None)
            print(f"\n⏰ No response received after 120 seconds")
            raise TimeoutError(f"No response received after 120 seconds")
    
    async def close(self):
        await self.client.aclose()
    
    async def read_user_input(self):
        """Read user input in a non-blocking way."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, input, "\n💬 You: ")
    
    async def interactive_mode(self):
        """Run interactive CLI mode with WebSocket streaming."""
        print("=" * 60)
        print("🚀 Cursor Mobile CLI Client (Streaming Mode)")
        print("=" * 60)
        print(f"Server: {self.server_url}")
        print(f"Session: {self.session_id}")
        print("=" * 60)
        print("\nCommands:")
        print("  - Type your prompt and press Enter to send")
        print("  - Type 'exit' or 'quit' to exit")
        print("  - Type 'history' to view message history")
        print("  - All Cursor messages will stream here in real-time")
        print("=" * 60)
        print()
        
        # Start WebSocket listener in background
        ws_task = asyncio.create_task(self.connect_websocket_with_retry())
        
        try:
            while True:
                try:
                    prompt = await self.read_user_input()
                    prompt = prompt.strip()
                    
                    if not prompt:
                        continue
                    
                    if prompt.lower() in ["exit", "quit"]:
                        print("👋 Goodbye!")
                        break
                    
                    if prompt.lower() == "history":
                        await self.show_history()
                        continue
                    
                    # Send prompt (response will come via WebSocket)
                    try:
                        await self.send_prompt(prompt)
                    except httpx.HTTPError as e:
                        print(f"\n❌ Error: {e}")
                    except TimeoutError as e:
                        print(f"\n⏰ {e}")
                
                except (KeyboardInterrupt, EOFError):
                    print("\n\n👋 Goodbye!")
                    break
        finally:
            ws_task.cancel()
            try:
                await ws_task
            except asyncio.CancelledError:
                pass
    
    async def connect_websocket_with_retry(self):
        """Connect to WebSocket with auto-retry on disconnect."""
        while True:
            try:
                await self.connect_websocket()
            except Exception as e:
                print(f"❌ WebSocket disconnected: {e}")
            
            # Reconnect after 5 seconds
            print("🔄 Reconnecting in 5 seconds...")
            await asyncio.sleep(5)
    
    async def show_history(self):
        """Show message history."""
        try:
            response = await self.client.get(
                f"{self.server_url}/messages/{self.session_id}",
                params={"limit": 20}
            )
            response.raise_for_status()
            data = response.json()
            
            print(f"\n📚 Message History (showing {len(data['messages'])} of {data['total']})")
            print("=" * 60)
            
            for msg in data["messages"]:
                msg_type = msg["type"]
                msg_data = msg["data"]
                
                if msg_type == "prompt":
                    print(f"\n💬 You: {msg_data['prompt'][:100]}{'...' if len(msg_data['prompt']) > 100 else ''}")
                elif msg_type == "assistant":
                    print(f"🤖 Cursor: {msg_data['text'][:100]}{'...' if len(msg_data['text']) > 100 else ''}")
            
            print("=" * 60)
        
        except httpx.HTTPError as e:
            print(f"❌ Error fetching history: {e}")


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Cursor Mobile CLI Client")
    parser.add_argument(
        "--server",
        default="http://localhost:8000",
        help="Relay server URL (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--session",
        default="cursor-desktop-session",
        help="Session ID (default: cursor-desktop-session)"
    )
    parser.add_argument(
        "prompt",
        nargs="*",
        help="Prompt to send (if not provided, enters interactive mode)"
    )
    
    args = parser.parse_args()
    
    client = CursorClient(server_url=args.server, session_id=args.session)
    
    try:
        if args.prompt:
            # One-shot mode with WebSocket
            prompt = " ".join(args.prompt)
            
            # Start WebSocket listener
            ws_task = asyncio.create_task(client.connect_websocket())
            
            # Give WebSocket time to connect
            await asyncio.sleep(1)
            
            try:
                # Send prompt and wait for response
                response = await client.send_prompt(prompt)
                # Response already printed via WebSocket handler
            except Exception as e:
                print(f"❌ Error: {e}")
            finally:
                ws_task.cancel()
                try:
                    await ws_task
                except asyncio.CancelledError:
                    pass
        else:
            # Interactive mode
            await client.interactive_mode()
    finally:
        await client.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
        sys.exit(0)

