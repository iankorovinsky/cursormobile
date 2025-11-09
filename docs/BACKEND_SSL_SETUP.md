# Backend SSL Proxy Setup

This guide explains how to set up an SSL proxy for the backend to enable secure WebSocket connections (`wss://`) from your PWA.

## Why Backend SSL Proxy?

When your PWA is accessed via HTTPS (`https://172.20.10.3:3001`), iOS Safari may block mixed content connections to `ws://` (insecure WebSocket). By running the backend through an SSL proxy, you can use `wss://` (secure WebSocket) which works seamlessly with HTTPS frontends.

## Setup

### 1. Ensure Certificates Exist

The same certificates used for the frontend can be used for the backend:

```bash
ls -la certs/
# Should show: myapp.local.pem and myapp.local-key.pem
```

If certificates don't exist, see `SSL_SETUP.md` for instructions.

### 2. Start Backend with Network Binding

Make sure your backend is running and accessible from the network:

```bash
cd relay-server
source .venv/bin/activate
fastapi dev server.py --host 0.0.0.0 --port 8000
```

### 3. Start Backend SSL Proxy

In a **separate terminal**, start the SSL proxy for the backend:

```bash
cd /Users/ivan/code/cursormobile
local-ssl-proxy --source 8001 --target 8000 \
  --cert ./certs/myapp.local.pem \
  --key ./certs/myapp.local-key.pem
```

You should see:
```
Started proxy: https://localhost:8001 → http://localhost:8000
```

### 4. Verify Backend is Accessible

Test the backend health endpoint via HTTPS:

```bash
curl -k https://172.20.10.3:8001/healthz
# Should return: {"ok":true,"timestamp":...}
```

## How It Works

- **Backend runs on**: `http://localhost:8000` (or `http://0.0.0.0:8000` for network access)
- **SSL Proxy listens on**: `https://0.0.0.0:8001`
- **Frontend connects to**: `wss://172.20.10.3:8001` (secure WebSocket)

The frontend automatically detects when it's on HTTPS and uses `wss://` on port 8001 instead of `ws://` on port 8000.

## Complete Setup (All Terminals)

**Terminal 1 - Backend:**
```bash
cd relay-server
source .venv/bin/activate
fastapi dev server.py --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev -- --hostname 0.0.0.0 --port 3000
```

**Terminal 3 - Frontend SSL Proxy:**
```bash
local-ssl-proxy --source 3001 --target 3000 \
  --cert ./certs/myapp.local.pem \
  --key ./certs/myapp.local-key.pem
```

**Terminal 4 - Backend SSL Proxy:**
```bash
local-ssl-proxy --source 8001 --target 8000 \
  --cert ./certs/myapp.local.pem \
  --key ./certs/myapp.local-key.pem
```

## Access from iPhone

1. Open Safari on iPhone
2. Navigate to: `https://172.20.10.3:3001`
3. Accept the certificate warning
4. The PWA will automatically connect to `wss://172.20.10.3:8001`

## Troubleshooting

### WebSocket Connection Fails (Code 1006)

If you're getting "Connection closed abnormally (code 1006)", `local-ssl-proxy` might not properly handle WebSocket upgrades. Try these solutions:

#### Option 1: Use stunnel (Better WebSocket Support)

Install stunnel:
```bash
brew install stunnel
```

Create a config file `stunnel-backend.conf`:
```
cert = /Users/ivan/code/cursormobile/certs/myapp.local.pem
key = /Users/ivan/code/cursormobile/certs/myapp.local-key.pem
accept = 8001
connect = 8000
```

Run stunnel:
```bash
stunnel stunnel-backend.conf
```

#### Option 2: Accept Certificate on iPhone

1. Open Safari on iPhone
2. Navigate to: `https://172.20.10.3:8001/healthz`
3. Accept the certificate warning
4. Then try the WebSocket connection again

#### Option 3: Use ngrok for Backend

If local SSL proxy doesn't work, use ngrok for the backend:

```bash
ngrok http 8000
```

Then manually set the backend URL in the PWA settings to the ngrok `wss://` URL.

### Other Issues

- **Connection refused**: Make sure backend is running with `--host 0.0.0.0`
- **Certificate errors**: Accept the self-signed certificate in Safari
- **Port already in use**: Check with `lsof -i :8001` and kill the process if needed

