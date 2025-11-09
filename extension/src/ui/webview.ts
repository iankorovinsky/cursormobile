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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
            background-color: #1C1C1C;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: #1C1C1C;
            color: #CCCCCC;
            display: flex;
            flex-direction: column;
            overflow: hidden;
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
            height: 100vh;
          }
          .auth-view {
            flex: 1;
            align-items: center;
            justify-content: center;
            padding: 24px;
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
            color: #CCCCCC;
          }
          .auth-card p {
            margin: 0;
            color: #808080;
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
          /* Chat Header */
          .chat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #333333;
            background: #1C1C1C;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .chat-title {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
            color: #CCCCCC;
          }
          .connection-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #808080;
          }
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #666666;
            transition: background 0.3s;
          }
          .status-dot.connected {
            background: #22c55e;
          }
          .status-dot.disconnected {
            background: #ef4444;
          }
          .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .user-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1px solid #333333;
          }
          .logout-btn {
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid #333333;
            background: transparent;
            color: #CCCCCC;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
          }
          .logout-btn:hover {
            background: #2A2A2A;
            border-color: #404040;
          }
          /* Messages Container */
          .messages-container {
            flex: 1;
            overflow-y: auto;
            background: #1C1C1C;
            padding: 0;
          }
          .messages-list {
            max-width: 100%;
            padding: 24px 16px;
            min-height: 100%;
          }
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #808080;
            text-align: center;
          }
          .empty-state p {
            margin: 4px 0;
            font-size: 14px;
          }
          .empty-state-subtitle {
            font-size: 12px;
            color: #666666;
          }
          .empty-state.hidden {
            display: none;
          }
          /* Message Styles */
          .message {
            margin-bottom: 24px;
            animation: fadeIn 0.3s ease-in;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .message-text {
            color: #CCCCCC;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .message-text.streaming {
            position: relative;
          }
          .message-text.streaming::after {
            content: '▊';
            color: #CCCCCC;
            animation: blink 1s infinite;
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          /* Code Block Styles */
          .code-block {
            margin: 12px 0;
            border-radius: 8px;
            border: 1px solid #333333;
            background: #242424;
            overflow: hidden;
          }
          .code-block-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #2D2D2D;
            border-bottom: 1px solid #333333;
          }
          .code-block-title {
            font-size: 12px;
            color: #808080;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
          }
          .code-block-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .code-block-copy {
            padding: 4px 8px;
            font-size: 11px;
            border: none;
            background: transparent;
            color: #808080;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s;
          }
          .code-block-copy:hover {
            background: #333333;
            color: #CCCCCC;
          }
          .code-block-copy.copied {
            color: #22c55e;
          }
          .code-block-content {
            padding: 12px;
            background: #1A1A1A;
            overflow-x: auto;
          }
          .code-block-content pre {
            margin: 0;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
            color: #E5E5E5;
            white-space: pre;
          }
          /* Payload Section */
          .payload-section {
            border-top: 1px solid #333333;
            background: #1C1C1C;
          }
          .payload-toggle {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: transparent;
            border: none;
            color: #CCCCCC;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
          }
          .payload-toggle:hover {
            background: #2A2A2A;
          }
          .toggle-icon {
            transition: transform 0.2s;
            color: #808080;
          }
          .payload-toggle.expanded .toggle-icon {
            transform: rotate(180deg);
          }
          .payload-content {
            padding: 16px;
            border-top: 1px solid #333333;
          }
          .description {
            color: #808080;
            font-size: 12px;
            margin-bottom: 12px;
          }
          .code-box {
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 12px;
            background: #1A1A1A;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            white-space: pre-wrap;
            word-break: break-all;
            position: relative;
            min-height: 40px;
            color: #E5E5E5;
          }
          .code-box.copied {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.1);
          }
          .copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 4px 12px;
            font-size: 11px;
            border: 1px solid #333333;
            border-radius: 6px;
            background: #2A2A2A;
            color: #CCCCCC;
            cursor: pointer;
            transition: all 0.2s;
          }
          .copy-btn:hover {
            background: #333333;
            border-color: #404040;
          }
          .copy-btn.copied {
            background: #22c55e;
            color: white;
            border-color: #22c55e;
          }
          .devtools-btn {
            padding: 8px 16px;
            font-size: 13px;
            border: 1px solid #333333;
            border-radius: 6px;
            background: #2A2A2A;
            color: #CCCCCC;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            margin-top: 12px;
          }
          .devtools-btn:hover {
            background: #333333;
            border-color: #404040;
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
          <!-- Header -->
          <div class="chat-header">
            <div class="header-left">
              <h1 class="chat-title">Cursor Mobile</h1>
              <div class="connection-status" id="connection-status">
                <span class="status-dot" id="status-dot"></span>
                <span class="status-text" id="status-text">Connecting...</span>
               </div>
             </div>
            <div class="header-right">
              ${userPicture ? `<img src="${escapeHtml(userPicture)}" alt="${escapedName}" class="user-avatar" />` : ''}
              <button id="logout-button" class="logout-btn">Log out</button>
           </div>
          </div>

          <!-- Messages Area -->
          <div class="messages-container" id="messages-container">
            <div class="messages-list" id="messages-list">
              <div class="empty-state" id="empty-state">
                <p>No messages yet.</p>
                <p class="empty-state-subtitle">Messages from Cursor will appear here.</p>
              </div>
            </div>
          </div>

          <!-- Payload Code Section (Collapsible) -->
          <div class="payload-section">
            <button class="payload-toggle" id="payload-toggle">
              <span>Payload Code</span>
              <svg class="toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <div class="payload-content" id="payload-content" style="display: none;">
          <p class="description">Copy the payload code below and paste it into Cursor's DevTools console.</p>
          <div class="code-container">
            <div class="code-box" id="code-box-0" style="max-height: 400px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre;">${escapedCode}</div>
            <button class="copy-btn" data-index="0" id="copy-btn-0">Copy</button>
          </div>
          <button class="devtools-btn" id="devtools-btn">Open Cursor DevTools</button>
            </div>
          </div>
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

            // Payload toggle
            const payloadToggle = document.getElementById('payload-toggle');
            const payloadContent = document.getElementById('payload-content');
            payloadToggle?.addEventListener('click', () => {
              const isExpanded = payloadContent.style.display !== 'none';
              payloadContent.style.display = isExpanded ? 'none' : 'block';
              payloadToggle.classList.toggle('expanded', !isExpanded);
            });

            // WebSocket connection and message handling
            const WS_URL = 'ws://localhost:8000';
            const SESSION_ID = 'cursor-desktop-session';
            let ws = null;
            let messages = [];
            let streamingMessages = new Map(); // messageId -> { element, fullText, displayedLength, intervalId }

            const statusDot = document.getElementById('status-dot');
            const statusText = document.getElementById('status-text');
            const messagesList = document.getElementById('messages-list');
            const emptyState = document.getElementById('empty-state');

            function updateConnectionStatus(connected) {
              if (statusDot) {
                statusDot.className = 'status-dot ' + (connected ? 'connected' : 'disconnected');
              }
              if (statusText) {
                statusText.textContent = connected ? 'Connected' : 'Disconnected';
              }
            }

            function escapeHtml(text) {
              const div = document.createElement('div');
              div.textContent = text;
              return div.innerHTML;
            }

            function parseCodeBlocks(text) {
              const codeBlocks = [];
              const codeBlockRegex = new RegExp('\\\\[CODE:\\\\s*([^\\\\]]+)\\\\]\\\\s*\\\\n([\\\\s\\\\S]*?)(?=\\\\n\\\\n\\\\[CODE:|$)', 'g');
              let match;
              while ((match = codeBlockRegex.exec(text)) !== null) {
                codeBlocks.push({
                  filename: match[1].trim(),
                  code: match[2].trim()
                });
              }
              return codeBlocks;
            }

            function removeCodeBlocks(text) {
              const regex = new RegExp('\\\\[CODE:\\\\s*[^\\\\]]+\\\\]\\\\s*\\\\n[\\\\s\\\\S]*?(?=\\\\n\\\\n\\\\[CODE:|$)', 'g');
              return text.replace(regex, '').trim();
            }

            function getLanguageFromFilename(filename) {
              const ext = filename.split('.').pop()?.toLowerCase() || '';
              const langMap = {
                'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
                'py': 'python', 'rb': 'ruby', 'go': 'go', 'rs': 'rust', 'java': 'java',
                'cpp': 'cpp', 'c': 'c', 'cs': 'csharp', 'php': 'php', 'swift': 'swift',
                'kt': 'kotlin', 'scala': 'scala', 'sh': 'bash', 'bash': 'bash', 'zsh': 'bash',
                'sql': 'sql', 'html': 'html', 'css': 'css', 'scss': 'scss', 'json': 'json',
                'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml', 'md': 'markdown', 'txt': 'text'
              };
              return langMap[ext] || 'text';
            }

            function createCodeBlock(block, index) {
              const filename = block.filename || \`code-\${index + 1}\`;
              const code = typeof block.code === 'string' ? block.code : JSON.stringify(block.code, null, 2);
              const language = block.language || getLanguageFromFilename(filename);
              
              const codeBlockDiv = document.createElement('div');
              codeBlockDiv.className = 'code-block';
              
              const header = document.createElement('div');
              header.className = 'code-block-header';
              
              const title = document.createElement('span');
              title.className = 'code-block-title';
              title.textContent = filename;
              
              const actions = document.createElement('div');
              actions.className = 'code-block-actions';
              
              const copyBtn = document.createElement('button');
              copyBtn.className = 'code-block-copy';
              copyBtn.textContent = 'Copy';
              copyBtn.addEventListener('click', async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  copyBtn.textContent = 'Copied!';
                  copyBtn.classList.add('copied');
                  setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.classList.remove('copied');
                  }, 2000);
                } catch (err) {
                  console.error('Failed to copy:', err);
                }
              });
              
              actions.appendChild(copyBtn);
              header.appendChild(title);
              header.appendChild(actions);
              
              const content = document.createElement('div');
              content.className = 'code-block-content';
              const pre = document.createElement('pre');
              pre.textContent = code;
              content.appendChild(pre);
              
              codeBlockDiv.appendChild(header);
              codeBlockDiv.appendChild(content);
              
              return codeBlockDiv;
            }

            function streamMessage(messageId, fullText, codeBlocks) {
              // Remove existing streaming if any
              if (streamingMessages.has(messageId)) {
                const existing = streamingMessages.get(messageId);
                if (existing.intervalId) {
                  clearInterval(existing.intervalId);
                }
              }

              const messageDiv = document.createElement('div');
              messageDiv.className = 'message';
              messageDiv.id = \`message-\${messageId}\`;
              
              const textDiv = document.createElement('div');
              textDiv.className = 'message-text streaming';
              
              let displayedLength = 0;
              const charsPerChunk = 2; // Characters to add per interval
              const delay = 20; // Milliseconds between chunks
              
              const intervalId = setInterval(() => {
                if (displayedLength < fullText.length) {
                  displayedLength = Math.min(displayedLength + charsPerChunk, fullText.length);
                  textDiv.textContent = fullText.substring(0, displayedLength);
                  scrollToBottom();
                } else {
                  clearInterval(intervalId);
                  textDiv.classList.remove('streaming');
                  streamingMessages.delete(messageId);
                  
                  // Add code blocks after streaming completes
                  if (codeBlocks && codeBlocks.length > 0) {
                    codeBlocks.forEach((block, idx) => {
                      const codeBlockEl = createCodeBlock(block, idx);
                      messageDiv.appendChild(codeBlockEl);
                    });
                  }
                }
              }, delay);
              
              messageDiv.appendChild(textDiv);
              messagesList.appendChild(messageDiv);
              
              if (emptyState) {
                emptyState.classList.add('hidden');
              }
              
              streamingMessages.set(messageId, {
                element: messageDiv,
                fullText: fullText,
                displayedLength: displayedLength,
                intervalId: intervalId
              });
              
              scrollToBottom();
            }

            function scrollToBottom() {
              const container = document.getElementById('messages-container');
              if (container) {
                container.scrollTop = container.scrollHeight;
              }
            }

            function connectWebSocket() {
              try {
                ws = new WebSocket(\`\${WS_URL}/ws/\${SESSION_ID}\`);
                
                ws.onopen = () => {
                  updateConnectionStatus(true);
                  console.log('WebSocket connected');
                };
                
                ws.onmessage = (event) => {
                  try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'response') {
                      const messageId = data.client_msg_id || \`msg-\${Date.now()}\`;
                      const text = data.text || '';
                      const codeBlocks = data.metadata?.code_blocks || [];
                      
                      // Parse code blocks from text if not in metadata
                      const parsedBlocks = codeBlocks.length > 0 ? codeBlocks : parseCodeBlocks(text);
                      const displayText = codeBlocks.length > 0 ? text : removeCodeBlocks(text);
                      
                      streamMessage(messageId, displayText, parsedBlocks);
                    } else if (data.type === 'ping') {
                      ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
                    }
                  } catch (err) {
                    console.error('Error handling WebSocket message:', err);
                  }
                };
                
                ws.onerror = (error) => {
                  console.error('WebSocket error:', error);
                  updateConnectionStatus(false);
                };
                
                ws.onclose = () => {
                  updateConnectionStatus(false);
                  console.log('WebSocket disconnected, reconnecting in 5 seconds...');
                  setTimeout(connectWebSocket, 5000);
                };
              } catch (err) {
                console.error('WebSocket connection error:', err);
                updateConnectionStatus(false);
                setTimeout(connectWebSocket, 5000);
              }
            }

            // Connect WebSocket when authenticated
            if (state.userEmail) {
              connectWebSocket();
            }

            // Reconnect when user authenticates
            const originalSetAuthenticated = setAuthenticated;
            setAuthenticated = function(user) {
              originalSetAuthenticated(user);
              if (user && !ws) {
                connectWebSocket();
              } else if (!user && ws) {
                ws.close();
                ws = null;
              }
            };

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
