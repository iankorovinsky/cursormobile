#!/usr/bin/env python3
"""Simple CLI client to interact with Cursor via relay server."""

import asyncio
import sys
from typing import Optional

import httpx


class CursorClient:
    def __init__(self, server_url: str = "http://localhost:8000", session_id: str = "cursor-desktop-session"):
        self.server_url = server_url
        self.session_id = session_id
        self.client = httpx.AsyncClient(timeout=180.0)
    
    async def send_prompt(self, prompt: str, metadata: Optional[dict] = None) -> dict:
        """Send a prompt to Cursor and wait for response."""
        print(f"\n📤 Sending prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
        
        # Send prompt
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
        
        print(f"✅ Prompt stored with ID: {client_msg_id}")
        print(f"⏳ Waiting for response from Cursor...")
        
        # Poll for response (with timeout)
        timeout = 120  # 2 minutes
        elapsed = 0
        poll_interval = 1  # 1 second
        
        while elapsed < timeout:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
            
            # Check messages endpoint for the response
            messages_response = await self.client.get(
                f"{self.server_url}/messages/{self.session_id}",
                params={"limit": 100}
            )
            messages_response.raise_for_status()
            messages_data = messages_response.json()
            
            # Look for assistant response to our prompt
            for msg in messages_data["messages"]:
                if msg["type"] == "assistant" and msg["data"]["client_msg_id"] == client_msg_id:
                    print(f"\n✅ Received response!")
                    return msg["data"]
        
        raise TimeoutError(f"No response received after {timeout} seconds")
    
    async def close(self):
        await self.client.aclose()
    
    async def interactive_mode(self):
        """Run interactive CLI mode."""
        print("=" * 60)
        print("🚀 Cursor Mobile CLI Client")
        print("=" * 60)
        print(f"Server: {self.server_url}")
        print(f"Session: {self.session_id}")
        print("=" * 60)
        print("\nCommands:")
        print("  - Type your prompt and press Enter to send")
        print("  - Type 'exit' or 'quit' to exit")
        print("  - Type 'history' to view message history")
        print("=" * 60)
        
        while True:
            try:
                prompt = input("\n💬 You: ").strip()
                
                if not prompt:
                    continue
                
                if prompt.lower() in ["exit", "quit"]:
                    print("👋 Goodbye!")
                    break
                
                if prompt.lower() == "history":
                    await self.show_history()
                    continue
                
                # Send prompt and get response
                try:
                    response = await self.send_prompt(prompt)
                    print(f"\n🤖 Cursor: {response['text']}")
                    
                    if response.get("metadata", {}).get("has_code_blocks"):
                        print("\n📄 Response contains code blocks")
                
                except httpx.HTTPError as e:
                    print(f"\n❌ Error: {e}")
                except TimeoutError as e:
                    print(f"\n⏰ {e}")
            
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except EOFError:
                print("\n\n👋 Goodbye!")
                break
    
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
            # One-shot mode
            prompt = " ".join(args.prompt)
            response = await client.send_prompt(prompt)
            print(f"\n🤖 Cursor: {response['text']}")
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

