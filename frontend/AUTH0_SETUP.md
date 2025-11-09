# Auth0 Setup Guide

This guide will walk you through setting up Auth0 authentication for cursormobile.

## Prerequisites

- An Auth0 account (sign up at https://auth0.com)
- Node.js and npm installed

## Step 1: Create an Auth0 Application

1. Go to the [Auth0 Dashboard](https://manage.auth0.com/)
2. Click on "Applications" in the sidebar
3. Click "Create Application"
4. Name your application (e.g., "cursormobile")
5. Select "Regular Web Applications"
6. Click "Create"

## Step 2: Configure Application Settings

1. In your Auth0 application settings, scroll to "Application URIs"
2. Set the following values:

   **For Local Development:**
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

   **For Production:**
   - **Allowed Callback URLs**: `https://yourdomain.com/api/auth/callback`
   - **Allowed Logout URLs**: `https://yourdomain.com`
   - **Allowed Web Origins**: `https://yourdomain.com`

3. Click "Save Changes"

## Step 3: Configure Environment Variables

1. Copy the `.env.local.example` file to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in the values from your Auth0 application:

   ```env
   AUTH0_ISSUER_BASE_URL=https://YOUR_DOMAIN.auth0.com
   AUTH0_CLIENT_ID=YOUR_CLIENT_ID
   AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
   AUTH0_SECRET=YOUR_LONG_RANDOM_SECRET
   AUTH0_BASE_URL=http://localhost:3000
   ```

   **Where to find these values:**
   - `AUTH0_ISSUER_BASE_URL`: Found in "Domain" field (add `https://` prefix)
   - `AUTH0_CLIENT_ID`: Found in "Client ID" field
   - `AUTH0_CLIENT_SECRET`: Found in "Client Secret" field (click to reveal)
   - `AUTH0_SECRET`: Generate with: `openssl rand -hex 32`
   - `AUTH0_BASE_URL`: Your application URL (production URL for production)

## Step 4: Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and you should be redirected to Auth0 login!

## Step 5: Test Authentication

1. Click the "Login" button in the sidebar
2. You'll be redirected to Auth0's login page
3. Sign up or log in with your credentials
4. After successful authentication, you'll be redirected back to the app
5. You should see your profile picture, name, and email in the sidebar
6. Click "Logout" to log out

## Troubleshooting

### Redirect URI Mismatch Error
- Make sure the callback URL in Auth0 settings matches exactly: `http://localhost:3000/api/auth/callback`
- Check that `AUTH0_BASE_URL` in `.env.local` is set correctly

### "Invalid State" Error
- This usually means the `AUTH0_SECRET` is not set or is incorrect
- Regenerate the secret: `openssl rand -hex 32`
- Clear your browser cookies and try again

### "Client Authentication Failed" Error
- Double-check your `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET`
- Make sure there are no extra spaces in your `.env.local` file

## Production Deployment

When deploying to production:

1. Update Auth0 application settings with your production URLs
2. Update environment variables in your hosting platform:
   - Set `AUTH0_BASE_URL` to your production domain
   - Generate a new `AUTH0_SECRET` for production
   - Keep the same `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET`

## Additional Features

### Customize Login Page
You can customize the Auth0 Universal Login page in the Auth0 Dashboard under "Branding" → "Universal Login"

### Add Social Logins
Enable social connections (Google, GitHub, etc.) in Auth0 Dashboard under "Authentication" → "Social"

### Add Multi-Factor Authentication
Enable MFA in Auth0 Dashboard under "Security" → "Multi-factor Auth"

## Learn More

- [Auth0 Next.js SDK Documentation](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Auth0 Dashboard](https://manage.auth0.com/)
