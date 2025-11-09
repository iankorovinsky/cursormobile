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
exports.ClipboardInjector = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Simple clipboard-based injection method
 * Copies code to clipboard and optionally automates typing into Cursor's console
 */
class ClipboardInjector {
    constructor(channelName = 'Cursor Console Injector') {
        this.output = vscode.window.createOutputChannel(channelName);
    }
    /**
     * Copy code to clipboard and show instructions
     */
    async copyToClipboard(code) {
        await vscode.env.clipboard.writeText(code);
        this.output.appendLine(`Code copied to clipboard: ${code.substring(0, 50)}...`);
        vscode.window.showInformationMessage('Code copied to clipboard! Open Cursor DevTools console (Cmd+Option+I) and paste (Cmd+V), then press Enter.', 'Open Instructions').then(action => {
            if (action === 'Open Instructions') {
                this.showInstructions();
            }
        });
    }
    /**
     * Copy code to clipboard and attempt to automate typing (macOS only)
     */
    async copyAndType(code) {
        const platform = process.platform;
        if (platform !== 'darwin') {
            // Fallback to clipboard only on non-macOS
            await this.copyToClipboard(code);
            vscode.window.showWarningMessage('Auto-typing is only available on macOS. Code has been copied to clipboard.');
            return;
        }
        try {
            // First, copy to clipboard as backup
            await vscode.env.clipboard.writeText(code);
            // Create AppleScript to automate
            const script = `
        tell application "Cursor"
          activate
        end tell
        delay 0.5
        
        -- Open DevTools (Cmd+Option+I)
        tell application "System Events"
          tell process "Cursor"
            keystroke "i" using {command down, option down}
          end tell
        end tell
        delay 1
        
        -- Focus console and paste
        tell application "System Events"
          tell process "Cursor"
            -- Try to focus console input (this might need adjustment)
            keystroke "v" using command down
            delay 0.3
            key code 36 -- Enter key
          end tell
        end tell
      `;
            await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
            this.output.appendLine('Automated typing attempted. Check Cursor console.');
            vscode.window.showInformationMessage('Attempted to auto-type into Cursor console. If it failed, code is in clipboard - paste manually.');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.output.appendLine(`Auto-typing failed: ${errorMessage}`);
            this.output.appendLine('Code is still in clipboard - paste manually.');
            await this.copyToClipboard(code);
            vscode.window.showWarningMessage('Auto-typing failed. Code copied to clipboard - paste manually into Cursor console.');
        }
    }
    /**
     * Simple method: just copy to clipboard with clear instructions
     */
    async simpleCopy(code) {
        await vscode.env.clipboard.writeText(code);
        const instructions = `Code copied to clipboard!

Next steps:
1. Open Cursor
2. Press Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux) to open DevTools
3. Click on the Console tab
4. Press Cmd+V (Mac) or Ctrl+V (Windows/Linux) to paste
5. Press Enter to execute

Your code:
${code.substring(0, 200)}${code.length > 200 ? '...' : ''}`;
        vscode.window.showInformationMessage('Code copied! Check instructions below.', 'Show Instructions')
            .then(action => {
            if (action === 'Show Instructions') {
                vscode.window.showInformationMessage(instructions);
            }
        });
        this.output.appendLine('=== Code Copied to Clipboard ===');
        this.output.appendLine(code);
        this.output.appendLine('=== Instructions ===');
        this.output.appendLine('1. Open Cursor DevTools (Cmd+Option+I)');
        this.output.appendLine('2. Go to Console tab');
        this.output.appendLine('3. Paste (Cmd+V) and press Enter');
    }
    showInstructions() {
        const instructions = `How to use clipboard injection:

1. Open Cursor
2. Press Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux)
3. Click the "Console" tab
4. Click in the console input area
5. Press Cmd+V (Mac) or Ctrl+V (Windows/Linux) to paste
6. Press Enter to execute

The code is already in your clipboard!`;
        vscode.window.showInformationMessage(instructions);
        this.output.appendLine(instructions);
    }
    dispose() {
        this.output.dispose();
    }
}
exports.ClipboardInjector = ClipboardInjector;
//# sourceMappingURL=clipboard-injector.js.map