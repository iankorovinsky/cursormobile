# Complete iPhone PWA Setup Guide

This guide walks you through setting up your Cursor Mobile PWA for testing on iPhone with HTTPS frontend and ngrok backend.

## Overview

- **Frontend**: Next.js app running on HTTP (port 3000) → SSL proxy on HTTPS (port 3001)
- **Backend**: FastAPI relay server running on HTTP (port 8000) → ngrok tunnel on HTTPS
- **Why**: iOS Safari requires HTTPS for PWA features and blocks mixed content (HTTPS page → ws:// connection)

## Prerequisites

- Node.js and npm installed
- Python 3.10+ with FastAPI installed
- ngrok installed: `brew install ngrok` or download from [ngrok.com](https://ngrok.com)
- `local-ssl-proxy` installed: `npm install -g local-ssl-proxy`
- Mac and iPhone on the same WiFi network

## Step 1: Generate SSL Certificates

If you haven't already, generate self-signed SSL certificates for the frontend:

```bash
cd /Users/ivan/code/cursormobile
mkdir -p certs
cd certs
openssl req -x509 -newkey rsa:4096 -keyout myapp.local-key.pem -out myapp.local.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=myapp.local"
cd ..
```

Certificates will be created in `certs/myapp.local.pem` and `certs/myapp.local-key.pem`.

## Step 2: Find Your Mac's Local IP

```bash
ipconfig getifaddr en0
```

Example output: `172.20.10.3`

**Note this IP** - you'll use it to access the app from your iPhone.

## Step 3: Start the Backend

**Terminal 1 - Backend:**
```bash
cd relay-server
source .venv/bin/activate
fastapi dev server.py --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` flag is **critical** - it makes the backend accessible from your iPhone on the network.

You should see:
```
🌐 Relay server: http://0.0.0.0:8000
```

## Step 4: Start ngrok for Backend

**Terminal 2 - ngrok:**
```bash
ngrok http 8000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`).

## Step 5: Update Hardcoded ngrok URL (if needed)

If your ngrok URL is different from the one in the code, update it:

**File:** `frontend/app/lib/config.ts`

Find line ~82 and update:
```typescript
const ngrokUrl = 'wss://YOUR_NGROK_URL_HERE';
```

Replace `YOUR_NGROK_URL_HERE` with your ngrok domain (use `wss://` not `https://`).

Example:
```typescript
const ngrokUrl = 'wss://abc123.ngrok-free.app';
```

## Step 6: Start the Frontend

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev -- --hostname 0.0.0.0 --port 3000
```

The `--hostname 0.0.0.0` flag makes the frontend accessible from your iPhone.

You should see:
```
✓ Ready on http://0.0.0.0:3000
```

## Step 7: Start Frontend SSL Proxy

**Terminal 4 - Frontend SSL Proxy:**
```bash
cd /Users/ivan/code/cursormobile
local-ssl-proxy --source 3001 --target 3000 \
  --cert ./certs/myapp.local.pem \
  --key ./certs/myapp.local-key.pem
```

You should see:
```
Started proxy: https://localhost:3001 → http://localhost:3000
```

## Step 8: Access from iPhone

1. **Open Safari on your iPhone** (not Chrome - Chrome on iOS has limited PWA support)

2. **Navigate to:** `https://YOUR_MAC_IP:3001`
   - Replace `YOUR_MAC_IP` with the IP from Step 2
   - Example: `https://172.20.10.3:3001`

3. **Accept the certificate warning:**
   - Tap "Show Details"
   - Tap "Visit Website"
   - This is normal for self-signed certificates

4. **Verify connection:**
   - The app should load
   - Check the empty state - it should show:
     - Current URL: `https://172.20.10.3:3001/chat`
     - Backend URL: `wss://abc123.ngrok-free.app` (your ngrok URL)
     - Connection Status: **Connected** (green dot) ✅

5. **Add to Home Screen:**
   - Tap the Share button (square with arrow)
   - Tap "Add to Home Screen"
   - Open the app from your home screen

## Complete Terminal Setup Summary

You need **4 terminals** running simultaneously:

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `fastapi dev server.py --host 0.0.0.0 --port 8000` | Backend server |
| 2 | `ngrok http 8000` | Backend HTTPS tunnel |
| 3 | `npm run dev -- --hostname 0.0.0.0 --port 3000` | Frontend dev server |
| 4 | `local-ssl-proxy --source 3001 --target 3000 --cert ./certs/myapp.local.pem --key ./certs/myapp.local-key.pem` | Frontend SSL proxy |

## Port Summary

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| Backend (FastAPI) | 8000 | HTTP/WS | Local only |
| ngrok Backend | - | HTTPS/WSS | Public (via ngrok URL) |
| Frontend (Next.js) | 3000 | HTTP | Local only |
| Frontend SSL Proxy | 3001 | HTTPS | Network (via Mac IP) |

## Troubleshooting

### Connection Status Shows "Disconnected"

1. **Check ngrok is running:**
   ```bash
   curl http://127.0.0.1:4040/api/tunnels
   ```
   Should return JSON with your tunnel info.

2. **Verify backend is accessible:**
   ```bash
   curl http://172.20.10.3:8000/healthz
   ```
   Should return: `{"ok":true,"timestamp":...}`

3. **Check ngrok URL in config:**
   - Open `frontend/app/lib/config.ts`
   - Verify line ~82 has the correct ngrok URL
   - Make sure it uses `wss://` not `https://`

4. **Check all 4 terminals are running:**
   - Backend (Terminal 1)
   - ngrok (Terminal 2)
   - Frontend (Terminal 3)
   - SSL Proxy (Terminal 4)

### Certificate Warnings

- **On Mac Safari**: Accept the certificate warning
- **On iPhone**: You must accept the certificate in Safari before the PWA will work
- Navigate to `https://YOUR_MAC_IP:3001` in Safari and accept the certificate

### Backend Not Accessible

- **Check `--host 0.0.0.0` flag**: Backend must be started with this flag
- **Check firewall**: macOS firewall might be blocking port 8000
- **Check network**: Mac and iPhone must be on the same WiFi

### ngrok URL Changes

Every time you restart ngrok, you get a new URL. Update it in:
- `frontend/app/lib/config.ts` line ~82

Or use the settings button (⚙️) in the PWA to manually set it.

### Port Already in Use

If you see "port already in use" errors:

```bash
# Check what's using the port
lsof -i :3001
lsof -i :8000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

## Quick Start Script

You can create a script to start everything at once. Create `start-dev.sh`:

```bash
#!/bin/bash

# Terminal 1: Backend
osascript -e 'tell app "Terminal" to do script "cd /Users/ivan/code/cursormobile/relay-server && source .venv/bin/activate && fastapi dev server.py --host 0.0.0.0 --port 8000"'

# Terminal 2: ngrok
osascript -e 'tell app "Terminal" to do script "ngrok http 8000"'

# Terminal 3: Frontend
osascript -e 'tell app "Terminal" to do script "cd /Users/ivan/code/cursormobile/frontend && npm run dev -- --hostname 0.0.0.0 --port 3000"'

# Terminal 4: SSL Proxy
osascript -e 'tell app "Terminal" to do script "cd /Users/ivan/code/cursormobile && local-ssl-proxy --source 3001 --target 3000 --cert ./certs/myapp.local.pem --key ./certs/myapp.local-key.pem"'

echo "✅ All services starting in separate terminals"
echo "📱 Access from iPhone: https://$(ipconfig getifaddr en0):3001"
```

Make it executable:
```bash
chmod +x start-dev.sh
```

## Testing Notifications

Once connected:

1. **Enable notifications:**
   - Click the bell icon (🔔) in the header
   - Tap "Allow" when prompted
   - If blocked, see `PWA_SETTINGS_TROUBLESHOOTING.md`

2. **Test notification:**
   - Click the bell icon again
   - You should see a test notification

3. **Test task completion:**
   - Send a message that will trigger `[TASK COMPLETE]`
   - You should receive a notification when the task completes

## Next Steps

- **Production**: Deploy backend to a service with HTTPS (Fly.io, Render, Railway)
- **Persistent ngrok URL**: Use ngrok's paid plan for static domains
- **Custom Domain**: Use your own domain with SSL certificates

## Related Documentation

- `PWA_SETTINGS_TROUBLESHOOTING.md` - Notification setup issues
- `WEBSOCKET_TROUBLESHOOTING.md` - WebSocket connection issues
- `NGROK.md` - Alternative ngrok setup methods

