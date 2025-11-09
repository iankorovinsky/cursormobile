# Phone Access Setup

Two ways to access your Cursor Mobile app from your phone:

## Option 1: Local Network (Easiest for Demo) ⭐

If your phone and Mac are on the **same WiFi network**, this is the simplest approach:

### 1. Find your Mac's local IP:
```bash
ipconfig getifaddr en0
```
Example output: `192.168.1.5`

### 2. Start both services with network binding:

**Terminal 1 - Backend:**
```bash
cd relay-server
source .venv/bin/activate
fastapi dev server.py --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev -- -H 0.0.0.0 -p 3000
```

### 3. Access from your phone:
Open your phone's browser and go to:
```
http://192.168.1.5:3000
```
(Replace `192.168.1.5` with your Mac's IP)

**That's it!** The frontend will automatically detect the backend at `ws://192.168.1.5:8000` 🎉

---

## Option 2: ngrok (Works from Anywhere)

Use this when you're not on the same WiFi or want to demo remotely.

### 1. Install ngrok:
```bash
brew install ngrok
```

### 2. Start both services normally:

**Terminal 1 - Backend:**
```bash
cd relay-server
source .venv/bin/activate
fastapi dev server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Start ngrok tunnels:

**Terminal 3 - Backend tunnel:**
```bash
ngrok http 8000
```
You'll get something like: `https://abc123.ngrok-free.app`

**Terminal 4 - Frontend tunnel:**
```bash
ngrok http 3000
```
You'll get something like: `https://xyz789.ngrok-free.app`

### 4. Configure the frontend:

Open the frontend URL in your phone's browser: `https://xyz789.ngrok-free.app`

Click the **⚙️ settings button** (bottom-right corner) and enter your **backend ngrok URL**:
```
wss://abc123.ngrok-free.app
```
(Note: Use `wss://` for secure WebSocket over HTTPS)

Click "Set" and **reload the page**. Done! 🚀

---

## Alternative: ngrok with Environment Variable

Instead of using the UI, you can set the backend URL as an environment variable:

```bash
cd frontend
NEXT_PUBLIC_RELAY_SERVER_URL=wss://abc123.ngrok-free.app npm run dev
```

Then start a new ngrok tunnel for the frontend:
```bash
ngrok http 3000
```

---

## Troubleshooting

### "WebSocket connection failed"
- Check that both services are running
- Verify the backend URL in the settings (⚙️ button)
- Make sure you're using `ws://` for http and `wss://` for https

### "Can't access on phone"
- Ensure phone and Mac are on the same WiFi (Option 1)
- Check your Mac's firewall settings
- Try using the explicit IP instead of `localhost`

### ngrok "Visit Site" warning page
- Click "Visit Site" button
- This is ngrok's free tier warning page
- The app will load after clicking through

---

## Console Helpers (Advanced)

The frontend exposes helper functions in the browser console:

```javascript
// Check current backend URL
__getBackendUrl()

// Set custom backend URL
__setBackendUrl("ws://192.168.1.5:8000")

// Clear custom URL (use auto-detection)
__clearBackendUrl()
```

Open your browser's Developer Tools (F12) and use these in the Console tab.
