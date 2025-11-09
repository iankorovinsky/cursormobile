import * as vscode from 'vscode';
import * as http from 'http';
import * as crypto from 'crypto';
import { URL } from 'url';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface Auth0Config {
  domain: string;
  clientId: string;
  audience?: string;
}

interface TokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export class Auth0Client {
  private config: Auth0Config;
  private server: http.Server | null = null;
  private codeVerifier: string = '';
  private codeChallenge: string = '';

  constructor(config: Auth0Config) {
    this.config = config;
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE(): { verifier: string; challenge: string } {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
  }

  /**
   * Open browser for Auth0 login
   */
  private async openBrowser(url: string): Promise<void> {
    const platform = process.platform;
    try {
      if (platform === 'darwin') {
        await execAsync(`open "${url}"`);
      } else if (platform === 'win32') {
        await execAsync(`start "" "${url}"`);
      } else {
        await execAsync(`xdg-open "${url}"`);
      }
    } catch (error) {
      throw new Error(`Failed to open browser: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Start local HTTP server to catch OAuth callback
   */
  private startCallbackServer(port: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.stopCallbackServer();
        reject(new Error('Authentication timeout. Please try again.'));
      }, 300000); // 5 minutes timeout

      this.server = http.createServer((req, res) => {
        if (!req.url) {
          res.writeHead(400);
          res.end('Bad Request');
          return;
        }

        const url = new URL(req.url, `http://localhost:${port}`);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        if (error) {
          clearTimeout(timeout);
          this.stopCallbackServer();
          res.writeHead(400);
          res.end(`<html><body><h1>Authentication Error</h1><p>${errorDescription || error}</p><p>You can close this window.</p></body></html>`);
          reject(new Error(errorDescription || error));
          return;
        }

        if (code) {
          clearTimeout(timeout);
          this.stopCallbackServer();
          res.writeHead(200);
          res.end('<html><body><h1>Authentication Successful</h1><p>You can close this window and return to VS Code.</p></body></html>');
          resolve(code);
        } else {
          res.writeHead(400);
          res.end('Bad Request');
        }
      });

      this.server.listen(port, () => {
        // Server started successfully
      });

      this.server.on('error', (err) => {
        clearTimeout(timeout);
        this.stopCallbackServer();
        reject(err);
      });
    });
  }

  /**
   * Stop the callback server
   */
  private stopCallbackServer(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
    const tokenUrl = `https://${this.config.domain}/oauth/token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: this.codeVerifier,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json() as Promise<TokenResponse>;
  }

  /**
   * Get user info from Auth0
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const userInfoUrl = `https://${this.config.domain}/userinfo`;
    
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json() as Promise<UserInfo>;
  }

  /**
   * Authenticate user with Auth0
   */
  async authenticate(): Promise<{ tokens: TokenResponse; user: UserInfo }> {
    const { verifier, challenge } = this.generatePKCE();
    this.codeVerifier = verifier;
    this.codeChallenge = challenge;

    // Use a random port for the callback server
    const port = 3001; // Could be made configurable
    const redirectUri = `http://localhost:${port}/callback`;

    // Build authorization URL
    const authUrl = new URL(`https://${this.config.domain}/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    if (this.config.audience) {
      authUrl.searchParams.set('audience', this.config.audience);
    }

    // Start callback server
    const codePromise = this.startCallbackServer(port);

    // Open browser
    await this.openBrowser(authUrl.toString());

    // Wait for callback
    const code = await codePromise;

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code, redirectUri);

    // Get user info
    const user = await this.getUserInfo(tokens.access_token);

    return { tokens, user };
  }

  /**
   * Logout (clear tokens)
   */
  async logout(): Promise<void> {
    // For VS Code extension, logout just means clearing stored tokens
    // Optionally, you could call Auth0's logout endpoint
    const logoutUrl = `https://${this.config.domain}/v2/logout`;
    const url = new URL(logoutUrl);
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('returnTo', 'http://localhost');
    
    try {
      await this.openBrowser(url.toString());
    } catch {
      // Ignore errors opening logout URL
    }
  }
}

