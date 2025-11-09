import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DevToolsOpener } from '../devtools-opener';
import { Auth0Client } from '../auth0-client';

const AUTH_STORAGE_KEY = 'cursorConsoleSnippets.userEmail';
const TOKEN_STORAGE_KEY = 'cursorConsoleSnippets.accessToken';
const USER_STORAGE_KEY = 'cursorConsoleSnippets.userInfo';

interface StoredUserInfo {
  email?: string;
  name?: string;
  picture?: string;
  sub: string;
}

function getAuth0Config(): { domain: string; clientId: string; audience?: string } | null {
  // Try to get from environment variables
  // Support both AUTH0_DOMAIN and AUTH0_ISSUER_BASE_URL
  let domain = process.env.AUTH0_DOMAIN;
  if (!domain && process.env.AUTH0_ISSUER_BASE_URL) {
    // Extract domain from AUTH0_ISSUER_BASE_URL (e.g., https://dev-xxx.us.auth0.com -> dev-xxx.us.auth0.com)
    domain = process.env.AUTH0_ISSUER_BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  
  const clientId = process.env.AUTH0_CLIENT_ID;
  
  if (!domain || !clientId) {
    return null;
  }

  // Ensure domain doesn't have protocol or trailing slash
  domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return {
    domain,
    clientId,
    audience: process.env.AUTH0_AUDIENCE,
  };
}

async function getStoredUser(context: vscode.ExtensionContext): Promise<StoredUserInfo | null> {
  const userInfo = context.globalState.get<StoredUserInfo>(USER_STORAGE_KEY);
  return userInfo || null;
}

async function storeUser(context: vscode.ExtensionContext, user: StoredUserInfo, accessToken: string): Promise<void> {
  await context.globalState.update(USER_STORAGE_KEY, user);
  await context.secrets.store(TOKEN_STORAGE_KEY, accessToken);
  await context.globalState.update(AUTH_STORAGE_KEY, user.email || null);
}

async function clearStoredUser(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(USER_STORAGE_KEY, undefined);
  await context.secrets.delete(TOKEN_STORAGE_KEY);
  await context.globalState.update(AUTH_STORAGE_KEY, undefined);
}

export function openSnippetsPanel(context: vscode.ExtensionContext): void {
  const panel = vscode.window.createWebviewPanel(
    'cursorConsoleSnippets',
    'Cursor Console Snippets',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  let currentUser: StoredUserInfo | null = null;
  
  // Load stored user info
  getStoredUser(context).then(user => {
    currentUser = user;
    panel.webview.html = getWebviewHtml(currentUser);
  });

  panel.webview.html = getWebviewHtml(null);
  panel.reveal(vscode.ViewColumn.One);

  const devToolsOpener = new DevToolsOpener();
  const auth0Config = getAuth0Config();

  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message?.type) {
      case 'copy':
        await vscode.env.clipboard.writeText(message.code || '');
        vscode.window.showInformationMessage(`Code ${message.codeIndex + 1} copied to clipboard!`);
        break;
      case 'openDevTools':
        await devToolsOpener.openDevTools();
        break;
      case 'login': {
        if (!auth0Config) {
          panel.webview.postMessage({
            type: 'authError',
            error: 'Auth0 is not configured. Please set AUTH0_DOMAIN and AUTH0_CLIENT_ID environment variables.',
          });
          return;
        }

        try {
          panel.webview.postMessage({
            type: 'authLoading',
            message: 'Opening browser for authentication...',
          });

          const auth0Client = new Auth0Client(auth0Config);
          const { tokens, user } = await auth0Client.authenticate();

          await storeUser(context, user, tokens.access_token);
          currentUser = user;

          panel.webview.postMessage({
            type: 'authState',
            email: user.email || null,
            name: user.name || null,
            picture: user.picture || null,
          });

          vscode.window.showInformationMessage(`Signed in as ${user.email || user.name || 'User'}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          panel.webview.postMessage({
            type: 'authError',
            error: errorMessage,
          });
          vscode.window.showErrorMessage(`Authentication failed: ${errorMessage}`);
        }
        break;
      }
      case 'logout': {
        try {
          if (auth0Config) {
            const auth0Client = new Auth0Client(auth0Config);
            await auth0Client.logout();
          }
        } catch {
          // Ignore logout errors
        }

        await clearStoredUser(context);
        currentUser = null;

        panel.webview.postMessage({
          type: 'authState',
          email: null,
          name: null,
          picture: null,
        });
        vscode.window.showInformationMessage('Signed out');
        break;
      }
      default:
        break;
    }
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getWebviewHtml(user: StoredUserInfo | null): string {
  const nonce = Date.now().toString();
  
  // Read payload code from absolute file path
  // The payload file is located at: /Users/iankorovinsky/hackutd/cursormobile/injection/fullPayload.js
  const payloadPath = '/Users/iankorovinsky/hackutd/cursormobile/injection/fullPayload.js';
  
  let payloadCode: string;
  try {
    if (!fs.existsSync(payloadPath)) {
      throw new Error(`Payload file not found at: ${payloadPath}`);
    }
    
    payloadCode = fs.readFileSync(payloadPath, 'utf8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to read fullPayload.js: ${errorMessage}`);
    payloadCode = `// Error loading payload: ${errorMessage}`;
  }
  

  const userEmail = user?.email || null;
  const userName = user?.name || null;
  const userPicture = user?.picture || null;
  const escapedEmail = escapeHtml(userEmail ?? '');
  const escapedName = escapeHtml(userName ?? '');
  const escapedCode = escapeHtml(payloadCode);

  return /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Cursor Console Snippets</title>
        <style>
          :root {
            color-scheme: dark;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #0e0e0e;
          }
          body {
            margin: 0;
            padding: 24px;
            min-height: 100vh;
            background: #0e0e0e;
            color: #f4f4f5;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          body[data-authenticated="false"] .auth-view {
            display: flex;
          }
          body[data-authenticated="false"] .app-view {
            display: none;
          }
          body[data-authenticated="true"] .auth-view {
            display: none;
          }
          body[data-authenticated="true"] .app-view {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .auth-view {
            flex: 1;
            align-items: center;
            justify-content: center;
          }
          .auth-card {
            width: min(420px, 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 32px;
            background: radial-gradient(circle at top, rgba(0, 122, 204, 0.2), rgba(10, 10, 10, 0.95));
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .auth-card h2 {
            margin: 0;
            font-size: 1.4rem;
          }
          .auth-card p {
            margin: 0;
            color: #9ca3af;
          }
          .auth-card label {
            font-size: 0.85rem;
            color: #a1a1aa;
            margin-bottom: 4px;
          }
          .auth-card input {
            width: 100%;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(15, 15, 15, 0.85);
            color: #f4f4f5;
            font-size: 0.95rem;
          }
          .auth-card button {
            padding: 10px 16px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #2563eb, #38bdf8);
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .auth-card button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .auth-card .error {
            color: #f87171;
            font-size: 0.85rem;
            min-height: 1.2rem;
          }
          .user-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.02);
          }
          .user-banner .email {
            font-weight: 600;
            color: #e0f2fe;
          }
          .user-banner button {
            padding: 6px 12px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: transparent;
            color: #f4f4f5;
            cursor: pointer;
          }
          h2 {
            margin: 0;
          }
          .description {
            color: rgba(199, 199, 199, 0.9);
            font-size: 0.95em;
            margin-bottom: 8px;
          }
          .code-box {
            border: 1px solid rgba(125, 125, 125, 0.3);
            border-radius: 12px;
            padding: 12px;
            background: rgba(125, 125, 125, 0.05);
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            word-break: break-all;
            position: relative;
            min-height: 40px;
          }
          .code-box.copied {
            border-color: #4caf50;
            background: rgba(76, 175, 80, 0.1);
          }
          .copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 4px 12px;
            font-size: 0.85em;
            border: 1px solid rgba(125, 125, 125, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.08);
            cursor: pointer;
            transition: all 0.2s;
          }
          .copy-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(125, 125, 125, 0.5);
          }
          .copy-btn.copied {
            background: #4caf50;
            color: white;
            border-color: #4caf50;
          }
          .devtools-btn {
            padding: 10px 20px;
            font-size: 1em;
            border: 1px solid rgba(125, 125, 125, 0.3);
            border-radius: 10px;
            background: rgba(33, 150, 243, 0.15);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            margin-top: 8px;
          }
          .devtools-btn:hover {
            background: rgba(33, 150, 243, 0.25);
            border-color: rgba(33, 150, 243, 0.5);
          }
          .code-container {
            position: relative;
          }
        </style>
      </head>
      <body data-authenticated="${user ? 'true' : 'false'}">
        <div class="auth-view">
          <div class="auth-card">
             <div>
               <h2>Sign in to Cursor Mobile</h2>
               <p>Click the button below to sign in with Auth0.</p>
             </div>
             <button type="button" id="login-button">Sign in with Auth0</button>
             <p class="error" id="login-error"></p>
          </div>
        </div>

        <div class="app-view">
           <div class="user-banner">
             <div style="display: flex; align-items: center; gap: 12px;">
               <div>
                 ${userName ? `<div style="font-weight: 600; color: #e0f2fe;">${escapedName}</div>` : ''}
                 <div class="email" id="user-email">${escapedEmail}</div>
               </div>
             </div>
             <button id="logout-button">Log out</button>
           </div>
          <h2>Cursor Console Snippets</h2>
          <p class="description">Copy the payload code below and paste it into Cursor's DevTools console.</p>
          <div class="code-container">
            <div class="code-box" id="code-box-0" style="max-height: 400px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre;">${escapedCode}</div>
            <button class="copy-btn" data-index="0" id="copy-btn-0">Copy</button>
          </div>
          <button class="devtools-btn" id="devtools-btn">Open Cursor DevTools</button>
        </div>
        
        <script nonce="${nonce}">
          (function() {
            const vscode = acquireVsCodeApi();
            const state = {
              userEmail: ${JSON.stringify(userEmail ?? '')} || null,
              userName: ${JSON.stringify(userName ?? '')} || null,
              userPicture: ${JSON.stringify(userPicture ?? '')} || null,
              payloadCode: ${JSON.stringify(payloadCode)}
            };

            const body = document.body;
            const loginButton = document.getElementById('login-button');
            const loginError = document.getElementById('login-error');
            const logoutButton = document.getElementById('logout-button');
            const userEmailEl = document.getElementById('user-email');

            function setAuthenticated(user) {
              state.userEmail = user?.email || null;
              state.userName = user?.name || null;
              state.userPicture = user?.picture || null;
              body.dataset.authenticated = user ? 'true' : 'false';
              if (userEmailEl) {
                userEmailEl.textContent = user?.email || '';
              }
              // Update UI with user info
              const userBanner = document.querySelector('.user-banner');
              if (userBanner && user) {
                const nameEl = userBanner.querySelector('.email')?.previousElementSibling;
                if (nameEl && user.name) {
                  nameEl.textContent = user.name;
                }
              }
            }

            function setLoginError(message) {
              if (!loginError) {
                return;
              }
              loginError.textContent = message || '';
            }

            function toggleLoginLoading(isLoading) {
              if (loginButton) {
                loginButton.disabled = isLoading;
                loginButton.textContent = isLoading ? 'Opening browser...' : 'Sign in with Auth0';
              }
            }

             document.getElementById('login-button')?.addEventListener('click', () => {
               setLoginError('');
               toggleLoginLoading(true);
               vscode.postMessage({ type: 'login' });
             });

            logoutButton?.addEventListener('click', () => {
              vscode.postMessage({ type: 'logout' });
            });

            window.addEventListener('message', (event) => {
              const message = event.data;
              if (!message) {
                return;
              }

               if (message.type === 'authState') {
                 toggleLoginLoading(false);
                 setLoginError('');
                 setAuthenticated(message.email ? {
                   email: message.email,
                   name: message.name || null,
                   picture: message.picture || null,
                   sub: ''
                 } : null);
               } else if (message.type === 'authError') {
                 toggleLoginLoading(false);
                 setLoginError(message.error || 'Unable to login.');
               } else if (message.type === 'authLoading') {
                 setLoginError('');
                 // Keep loading state
               }
            });

            // Single copy button for payload code
            const copyBtn = document.getElementById('copy-btn-0');
            const codeBox = document.getElementById('code-box-0');

            copyBtn?.addEventListener('click', () => {
              vscode.postMessage({
                type: 'copy',
                code: state.payloadCode,
                codeIndex: 0,
              });

              copyBtn.textContent = 'Copied!';
              copyBtn.classList.add('copied');
              codeBox?.classList.add('copied');

              setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.classList.remove('copied');
                codeBox?.classList.remove('copied');
              }, 2000);
            });

            document.getElementById('devtools-btn')?.addEventListener('click', () => {
              vscode.postMessage({ type: 'openDevTools' });
            });

             setAuthenticated(state.userEmail ? {
               email: state.userEmail,
               name: state.userName,
               picture: state.userPicture,
               sub: ''
             } : null);
          })();
        </script>
      </body>
    </html>
  `;
}
