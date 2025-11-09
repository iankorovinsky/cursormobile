# WebSocket Connection Troubleshooting (Code 1006)

If you're getting "Connection closed abnormally (code 1006)" when trying to connect via `wss://`, iOS Safari is likely blocking the WebSocket connection due to the self-signed certificate.

## Solution: Use ngrok for Backend

ngrok provides a trusted certificate and works reliably with WebSockets on iOS.

### Step 1: Start ngrok for Backend

```bash
ngrok http 8000
```

You'll get a URL like: `https://abc123.ngrok-free.app`

### Step 2: Configure Backend URL in PWA

1. Open your PWA on iPhone
2. Click the ⚙️ settings button (bottom-right corner)
3. Enter the backend URL: `wss://abc123.ngrok-free.app`
   - **Important**: Use `wss://` (not `ws://`) and don't include `/ws/` in the path
4. Click "Set"
5. Reload the page

The frontend will automatically append `/ws/{sessionId}` to the URL you provide.

### Step 3: Verify Connection

After reloading, check the connection status in the empty state. It should show:
- ✅ Connection Status: Connected (green dot)
- Backend URL: `wss://abc123.ngrok-free.app`

## Why This Works

- ngrok provides a trusted SSL certificate (not self-signed)
- iOS Safari allows WebSocket connections to trusted certificates
- ngrok properly handles WebSocket upgrades
- No certificate warnings or trust issues

## Alternative: Accept Certificate on iPhone

If you want to keep using stunnel/local-ssl-proxy:

1. On iPhone Safari, navigate to: `https://172.20.10.3:8001/healthz`
2. Accept the certificate warning
3. Then try the WebSocket connection

However, iOS may still block WebSocket connections even after accepting the HTTP certificate, which is why ngrok is recommended.

