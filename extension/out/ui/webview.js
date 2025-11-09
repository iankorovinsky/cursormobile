"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSnippetsPanel = openSnippetsPanel;
const vscode = __importStar(require("vscode"));
const devtools_opener_1 = require("../devtools-opener");
function openSnippetsPanel(context) {
    const panel = vscode.window.createWebviewPanel('cursorConsoleSnippets', 'Cursor Console Snippets', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
    });
    panel.webview.html = getWebviewHtml();
    panel.reveal(vscode.ViewColumn.One);
    const devToolsOpener = new devtools_opener_1.DevToolsOpener();
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message?.type === 'copy') {
            await vscode.env.clipboard.writeText(message.code || '');
            vscode.window.showInformationMessage(`Code ${message.codeIndex + 1} copied to clipboard!`);
        }
        else if (message?.type === 'openDevTools') {
            await devToolsOpener.openDevTools();
        }
    });
}
function getWebviewHtml() {
    const nonce = Date.now().toString();
    // Three example console.log statements
    const examples = [
        'console.log("Hello World from Cursor Console Injector!")',
        'console.log("Current URL:", window.location.href)',
        'console.log("User Agent:", navigator.userAgent)'
    ];
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
            color-scheme: light dark;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          h2 {
            margin: 0 0 8px 0;
          }
          .description {
            color: rgba(125, 125, 125, 0.9);
            font-size: 0.9em;
            margin-bottom: 8px;
          }
          .code-box {
            border: 1px solid rgba(125, 125, 125, 0.3);
            border-radius: 6px;
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
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.2s;
          }
          .copy-btn:hover {
            background: rgba(255, 255, 255, 0.2);
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
            border-radius: 6px;
            background: rgba(33, 150, 243, 0.1);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            margin-top: 8px;
          }
          .devtools-btn:hover {
            background: rgba(33, 150, 243, 0.2);
            border-color: rgba(33, 150, 243, 0.5);
          }
          .code-container {
            position: relative;
          }
        </style>
      </head>
      <body>
        <h2>Cursor Console Snippets</h2>
        <p class="description">Click "Copy" to copy code to clipboard, then paste into Cursor's DevTools console.</p>
        
        ${examples.map((code, index) => `
          <div class="code-container">
            <div class="code-box" id="code-box-${index}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <button class="copy-btn" data-index="${index}" id="copy-btn-${index}">Copy</button>
          </div>
        `).join('')}
        
        <button class="devtools-btn" id="devtools-btn">Open Cursor DevTools</button>
        
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          const examples = ${JSON.stringify(examples)};

          // Copy button handlers
          examples.forEach((code, index) => {
            const copyBtn = document.getElementById('copy-btn-' + index);
            const codeBox = document.getElementById('code-box-' + index);
            
            copyBtn.addEventListener('click', () => {
              vscode.postMessage({
                type: 'copy',
                code: code,
                codeIndex: index
              });
              
              // Visual feedback
              copyBtn.textContent = 'Copied!';
              copyBtn.classList.add('copied');
              codeBox.classList.add('copied');
              
              setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.classList.remove('copied');
                codeBox.classList.remove('copied');
              }, 2000);
            });
          });

          // DevTools button handler
          document.getElementById('devtools-btn').addEventListener('click', () => {
            vscode.postMessage({
              type: 'openDevTools'
            });
          });

        </script>
      </body>
    </html>
  `;
}
//# sourceMappingURL=webview.js.map