# Auth0 Setup for VS Code Extension

This extension uses Auth0 for authentication. Follow these steps to configure it.

## Prerequisites

- An Auth0 account (sign up at https://auth0.com)
- Auth0 application configured (same as your frontend app)

## Step 1: Configure Auth0 Application

1. Go to the [Auth0 Dashboard](https://manage.auth0.com/)
2. Select your application (or create a new "Regular Web Application")
3. In Application Settings, add to **Allowed Callback URLs**:
   ```
   http://localhost:3001/callback
   ```
4. Add to **Allowed Logout URLs**:
   ```
   http://localhost
   ```
5. Save changes

## Step 2: Configure Auth0

The extension automatically loads Auth0 configuration from a `.env` file in the extension root directory. **No need to set environment variables manually!**

### Option A: Use .env file (Recommended)

A `.env` file has been created in the extension root with your Auth0 credentials. It will be loaded automatically when the extension starts.

If you need to edit it, the file is located at:
```
extension/.env
```

The `.env` file should contain:
```env
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
```

### Option B: Set Environment Variables Manually

If you prefer to use environment variables instead of a `.env` file:

### macOS/Linux:
```bash
export AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
export AUTH0_CLIENT_ID=your_client_id
# Optional: if using Auth0 APIs
# export AUTH0_AUDIENCE=your_api_identifier
```

**Alternative** (using AUTH0_DOMAIN instead):
```bash
export AUTH0_DOMAIN=your-domain.auth0.com
export AUTH0_CLIENT_ID=your_client_id
```

### Windows (PowerShell):
```powershell
$env:AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
$env:AUTH0_CLIENT_ID="your_client_id"
```

### Windows (Command Prompt):
```cmd
set AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
set AUTH0_CLIENT_ID=your_client_id
```

## Step 3: Launch VS Code

Since the extension automatically loads from `.env`, you can launch VS Code normally:

```bash
code /path/to/extension
```

Or simply press `F5` in VS Code to start the Extension Development Host.

**Note:** The `.env` file is automatically loaded when the extension activates. No manual environment variable setup needed!

## Step 4: Test Authentication

1. Press `F5` to launch Extension Development Host
2. Run command: "Open Console Snippets"
3. Click "Sign in with Auth0"
4. Browser should open with Auth0 login
5. After login, you'll be redirected back and signed in

## How It Works

1. **PKCE Flow**: Uses Authorization Code Flow with PKCE (recommended for desktop apps)
2. **Local Server**: Starts a local HTTP server on port 3001 to catch the OAuth callback
3. **Browser Login**: Opens your default browser for Auth0 Universal Login
4. **Token Storage**: Stores access tokens securely using VS Code's SecretStorage API
5. **User Info**: Stores user profile (email, name, picture) in extension global state

## Troubleshooting

### "Auth0 is not configured" Error
- Make sure environment variables are set before launching VS Code
- Restart VS Code after setting environment variables
- Check that `AUTH0_ISSUER_BASE_URL` (or `AUTH0_DOMAIN`) and `AUTH0_CLIENT_ID` are set correctly
- Verify with: `echo $AUTH0_CLIENT_ID` (macOS/Linux) or `echo $env:AUTH0_CLIENT_ID` (PowerShell)

### "Authentication timeout" Error
- Make sure port 3001 is not in use
- Check firewall settings allow localhost connections
- Try again - the timeout is 5 minutes

### Browser Doesn't Open
- Check your default browser settings
- Try manually opening: `https://your-domain.auth0.com/authorize?...`
- Check console for errors

### Callback URL Mismatch
- Ensure `http://localhost:3001/callback` is in Auth0 Allowed Callback URLs
- Check that the URL matches exactly (no trailing slashes)

## Security Notes

- Access tokens are stored securely using VS Code's SecretStorage API
- Tokens are encrypted and stored in your system's credential store
- The extension uses PKCE for additional security
- No credentials are stored in plain text

## Using Same Auth0 App as Frontend

You can use the same Auth0 application as your frontend, just make sure:
- Both callback URLs are added: `http://localhost:3000/api/auth/callback` (frontend) and `http://localhost:3001/callback` (extension)
- The same `AUTH0_CLIENT_ID` is used in both `.env` files
- Environment variables match your frontend `.env.local` file:
  - `AUTH0_ISSUER_BASE_URL` should match your Auth0 domain
  - `AUTH0_CLIENT_ID` should match your Auth0 client ID

