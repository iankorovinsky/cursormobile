Perfect 👍 — here’s a clean, ready-to-commit LOCAL_PWA_SETUP.md you can drop straight into your repo:

# 🧭 Local PWA Setup for iPhone (Next.js + HTTPS)

This guide explains how to run your **Next.js PWA** locally with **HTTPS** so you can test it on an **iPhone**, including Safari push notifications.

---

## ⚙️ 1. Run Next.js on all interfaces

```bash
next dev --hostname 0.0.0.0 --port 3000


This makes your app accessible from any device on your local network.

🌐 2. Find your Mac’s local network IP

Run:

ipconfig getifaddr en0


Example result:

172.20.10.3


Use that IP when connecting from your iPhone.

🔒 3. Generate a trusted local SSL certificate

Install mkcert
 if you don’t have it:

brew install mkcert
mkcert -install


Then generate a cert for your local domain and IP:

mkcert myapp.local 172.20.10.3 localhost


This creates files like:

myapp.local+2.pem
myapp.local+2-key.pem

🔁 4. Start HTTPS proxies for both frontend and backend

**Frontend SSL Proxy:**
```bash
npm install -g local-ssl-proxy
local-ssl-proxy --source 3001 --target 3000 \
  --cert ./certs/myapp.local.pem \
  --key ./certs/myapp.local-key.pem
```

**Backend SSL Proxy (in a separate terminal):**
```bash
local-ssl-proxy --source 8001 --target 8000 \
  --cert ./certs/myapp.local.pem \
  --key ./certs/myapp.local-key.pem
```

You should see:
- `Started proxy: https://localhost:3001 → http://localhost:3000`
- `Started proxy: https://localhost:8001 → http://localhost:8000`

📱 5. Connect on your iPhone

Ensure your Mac and iPhone are on the same Wi-Fi.

On your iPhone Safari, visit:

https://172.20.10.3:3001


Tap “Show Details → Visit Website” to trust your local cert.

The app should load securely over HTTPS.

🧩 6. (Optional) Install as PWA

Tap Share → Add to Home Screen.

Open the app from your home screen.

You can now test PWA install flow, service workers, and Safari push notifications.

✅ Summary
Component	Port	Description
Next.js dev server	3000	HTTP (local)
Frontend SSL Proxy	3001	HTTPS (for iPhone access)
Backend (FastAPI)	8000	HTTP/WS (local)
Backend SSL Proxy	8001	HTTPS/WSS (for iPhone access)
Access from iPhone	https://<your-mac-ip>:3001	Secure PWA testing
Backend WebSocket	wss://<your-mac-ip>:8001	Secure WebSocket connection

Tip:
If the proxy fails with “port already in use”, run:

lsof -i :3001
kill -9 <PID>
