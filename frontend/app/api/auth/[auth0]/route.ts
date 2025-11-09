import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  const { auth0: action } = await params;

  // Validate environment variables
  const requiredEnvVars = {
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || value.includes('example') || value.includes('your_'))
    .map(([key]) => key);

  if (missingVars.length > 0 && action !== 'me') {
    return NextResponse.json(
      {
        error: 'Auth0 not configured',
        message: `Please configure the following environment variables in frontend/.env.local: ${missingVars.join(', ')}`,
        help: 'See frontend/.env.local.example for setup instructions'
      },
      { status: 500 }
    );
  }

  // Handle Auth0 authentication flow
  switch (action) {
    case 'login':
      // Redirect to Auth0 login
      const loginUrl = new URL(`${process.env.AUTH0_ISSUER_BASE_URL}/authorize`);
      loginUrl.searchParams.set('response_type', 'code');
      loginUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID!);
      loginUrl.searchParams.set('redirect_uri', `${process.env.AUTH0_BASE_URL}/api/auth/callback`);
      loginUrl.searchParams.set('scope', 'openid profile email');
      return NextResponse.redirect(loginUrl.toString());

    case 'logout':
      // Clear session cookie and redirect
      const logoutUrl = new URL(`${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout`);
      logoutUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID!);
      logoutUrl.searchParams.set('returnTo', process.env.AUTH0_BASE_URL!);
      
      const logoutResponse = NextResponse.redirect(logoutUrl.toString());
      logoutResponse.cookies.delete('auth0_session');
      return logoutResponse;

    case 'callback':
      // Handle Auth0 callback - exchange code for tokens
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}?error=${error}`);
      }

      if (!code) {
        return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}?error=no_code`);
      }

      try {
        // Exchange authorization code for tokens
        const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.AUTH0_CLIENT_ID!,
            client_secret: process.env.AUTH0_CLIENT_SECRET!,
            code: code,
            redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
          }).toString(),
        });

        if (!tokenResponse.ok) {
          throw new Error('Token exchange failed');
        }

        const tokens = await tokenResponse.json();

        // Get user info from Auth0
        const userResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const user = await userResponse.json();

        // Create response and set session cookie
        const response = NextResponse.redirect(process.env.AUTH0_BASE_URL!);
        
        // Store user session in a cookie (in production, use httpOnly, secure, sameSite)
        const sessionData = JSON.stringify({
          user,
          accessToken: tokens.access_token,
          expiresAt: Date.now() + (tokens.expires_in * 1000),
        });

        // Use a simple cookie for now (in production, encrypt this)
        response.cookies.set('auth0_session', sessionData, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: tokens.expires_in || 86400, // Default to 24 hours
          path: '/',
        });

        return response;
      } catch (err) {
        console.error('Auth0 callback error:', err);
        return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}?error=callback_failed`);
      }

    case 'me':
      // Return user session from cookie
      const sessionCookie = request.cookies.get('auth0_session');
      
      if (!sessionCookie) {
        return NextResponse.json(null);
      }

      try {
        const sessionData = JSON.parse(sessionCookie.value);
        
        // Check if session is expired
        if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
          return NextResponse.json(null);
        }

        // Return user info
        return NextResponse.json(sessionData.user);
      } catch {
        return NextResponse.json(null);
      }

    default:
      return new NextResponse('Not Found', { status: 404 });
  }
}
