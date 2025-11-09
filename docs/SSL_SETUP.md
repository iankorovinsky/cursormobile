# SSL Setup for Local PWA Development

## Why HTTPS is Required

iOS PWAs require HTTPS (or localhost) for:
- Service Workers to work properly
- Push Notifications to function
- Secure WebSocket connections

## Generated Certificates

Self-signed SSL certificates have been generated in the `certs/` directory:
- `myapp.local.pem` - Certificate file
- `myapp.local-key.pem` - Private key file

## Setup Steps

### 1. Add Domain to /etc/hosts

Add this line to `/etc/hosts` (requires sudo):

```bash
127.0.0.1 myapp.local
```

### 2. Trust the Certificate (Optional but Recommended)

To avoid browser security warnings, you can trust the certificate:

**On macOS:**
1. Double-click `certs/myapp.local.pem`
2. Open Keychain Access
3. Find "myapp.local" in "login" keychain
4. Double-click it
5. Expand "Trust" section
6. Set "When using this certificate" to "Always Trust"

**Or use mkcert (better option):**
```bash
# Install mkcert
brew install mkcert

# Install local CA
mkcert -install

# Generate trusted certificates
cd certs
mkcert myapp.local
# This creates myapp.local.pem and myapp.local-key.pem
```

### 3. Start the SSL Proxy

```bash
local-ssl-proxy --source 3001 --target 3000 \
  --cert ./certs/myapp.local.pem \
  --key ./certs/myapp.local-key.pem
```

### 4. Start Your Next.js App

In another terminal:
```bash
cd frontend
npm run dev
```

### 5. Access Your App

Open in Safari: `https://myapp.local:3001`

## For iPhone Testing

1. Make sure your iPhone and Mac are on the same WiFi network
2. Find your Mac's local IP address:
   ```bash
   ipconfig getifaddr en0
   ```
3. On your iPhone, go to: `https://YOUR_MAC_IP:3001`
4. You'll need to accept the self-signed certificate warning
5. Add to Home Screen from Safari

## Alternative: Use ngrok

If you want a public HTTPS URL without certificate setup:
```bash
ngrok http 3000
```

Then use the ngrok HTTPS URL for your PWA.

## Troubleshooting

- **Certificate warnings**: This is normal with self-signed certs. Click "Advanced" → "Proceed" in the browser.
- **Connection refused**: Make sure the SSL proxy is running and targeting the correct port.
- **Service Worker not working**: Ensure you're accessing via HTTPS, not HTTP.

