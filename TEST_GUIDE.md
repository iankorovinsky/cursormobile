# Testing Guide - Full System

## ✅ Quick Test Checklist

### 1. Start Fresh Server
```bash
cd relay-server
source .venv/bin/activate
# Kill any old servers first!
fastapi dev server.py
```

### 2. Clear Cursor Console & Inject Payload
1. Open Cursor DevTools (Help → Toggle Developer Tools)
2. **Clear console** (important!)
3. Copy entire `injection/fullPayload.js`
4. Paste in console and press Enter

**You should see ONCE:**
```
🚀 Cursor Mobile: found X assistant message(s)
👁️ Watching for new messages...
🌐 Relay server: http://localhost:8000
📝 Session ID: cursor-desktop-session
🔌 Connecting to WebSocket...
✅ WebSocket connected
✅ Sent via WebSocket: startup
💾 To manually stop: window.CURSOR_MOBILE_CLEANUP()
```

**⚠️  If you see duplicates:**
- Multiple payload instances are running
- Close and reopen Cursor DevTools
- Paste payload again

### 3. Start CLI Client
```bash
cd relay-server
source .venv/bin/activate
python cli_client.py
```

**You should see:**
```
🔌 Connecting to WebSocket: ws://localhost:8000/ws/cursor-desktop-session
✅ WebSocket connected

🤖 Cursor: 🚀 Cursor Mobile full payload connected

💬 You: 
```

## 🧪 Test Scenarios

### Test 1: Simple Q&A
**In CLI, type:**
```
what is 2+2?
```

**Expected Flow:**
1. CLI prints: `📤 You: what is 2+2?`
2. Server logs: `📤 Sent prompt to WebSocket subscriber`
3. Cursor console: `📥 Received prompt` → `✅ Injected prompt`
4. Cursor generates response
5. Cursor console: `🔔 NEW MESSAGE [X]:` with text
6. CLI prints: `🤖 Cursor: 2+2 equals 4.`

### Test 2: Code Changes
**In CLI, type:**
```
add a comment at the top of your test file saying "Hello from Texas"
```

**Expected in Cursor console:**
```
🔔 NEW MESSAGE [X]:
Added comment...
📄 Found 1 code block(s):
  - yourfile.py (XXX chars)
✅ Sent via WebSocket: X
```

**Expected in CLI:**
```
🤖 Cursor: Added comment at the top...

📄 Code Changes (1 file(s)):

============================================================
📝 yourfile.py
============================================================
    1 + # Hello from Texas
    2 | def main():
    3 |     ...
============================================================
```

### Test 3: Manual Cursor Usage
**Type DIRECTLY in Cursor UI (not CLI):**
```
explain what a webhook is
```

**Expected:**
- Response appears in Cursor ✅
- Response ALSO streams to CLI in real-time ✅

## 🐛 Common Issues

### Issue: Multiple Startup Messages
**Symptom:** CLI shows "🤖 Cursor: 🚀..." 3+ times

**Fix:**
1. Close Cursor DevTools completely
2. Reopen DevTools
3. Paste payload fresh
4. Should see cleanup message

### Issue: Code Blocks Not Showing
**Check Cursor console for:**
```
📄 Found X code block(s):
  - filename.py (123 chars)
```

**If missing:**
- Code blocks might not have Monaco editors
- Try a different code change
- Check `extractCodeBlocks` is finding `.composer-code-block-container`

### Issue: WebSocket Keeps Disconnecting
**Symptom:** Reconnecting every 5 seconds

**Possible causes:**
1. Server restarted - normal, will reconnect
2. Multiple payload instances fighting - reload payload
3. Server error - check server logs

### Issue: CLI Not Receiving Messages
**Check:**
1. WebSocket connected in CLI? Look for `✅ WebSocket connected`
2. Server logs showing `📤 Sent prompt to WebSocket`?
3. Cursor payload connected? Check console
4. Session IDs match? Both should be `cursor-desktop-session`

## 📊 Expected Data Flow

```
CLI Input → HTTP /prompt → Server → WebSocket → Cursor Payload
                                                      ↓
                                               Inject & Send
                                                      ↓
                                               Cursor Responds
                                                      ↓
                                          Extract Text + Code
                                                      ↓
Server ← WebSocket ← Response + metadata.code_blocks
   ↓
Broadcast to CLI WebSocket
   ↓
CLI displays with formatted code blocks
```

## 🔧 Manual Commands

### Kill Payload
In Cursor console:
```javascript
window.CURSOR_MOBILE_CLEANUP()
```

### Check Messages
In Cursor console:
```javascript
window.cursorMessages  // See all captured messages
```

### Manual Test Injection
In Cursor console:
```javascript
await window.sendPromptToCursor("test message")
```

### Change Session
In Cursor console:
```javascript
window.configureCursorRelay({ sessionId: 'my-test-session' })
```

## ✨ Success Criteria

- ✅ Single startup message in CLI
- ✅ Prompts flow both directions
- ✅ Code diffs display with colors
- ✅ No duplicate messages
- ✅ Auto-reconnect on server restart
- ✅ Clean console output

