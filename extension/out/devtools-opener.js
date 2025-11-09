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
exports.DevToolsOpener = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class DevToolsOpener {
    async openDevTools() {
        const platform = process.platform;
        try {
            if (platform === 'darwin') {
                const script = `
          tell application "Cursor"
            activate
          end tell
          delay 0.3
          tell application "System Events"
            tell process "Cursor"
              keystroke "i" using {command down, option down}
            end tell
          end tell
        `;
                await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
                vscode.window.showInformationMessage('DevTools opened! Go to the Console tab.');
            }
            else if (platform === 'win32') {
                await execAsync(`powershell -Command "& {Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::AppActivate('Cursor'); Start-Sleep -Milliseconds 300; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^+{I}')}"`);
                vscode.window.showInformationMessage('DevTools opened! Go to the Console tab.');
            }
            else {
                try {
                    await execAsync('xdotool search --name "Cursor" windowactivate key ctrl+shift+i');
                    vscode.window.showInformationMessage('DevTools opened! Go to the Console tab.');
                }
                catch {
                    vscode.window.showWarningMessage('Could not open DevTools automatically. Please press Ctrl+Shift+I manually in Cursor.');
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showWarningMessage(`Could not open DevTools automatically: ${errorMessage}. ` +
                `Please press Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux) manually in Cursor.`);
        }
    }
}
exports.DevToolsOpener = DevToolsOpener;
//# sourceMappingURL=devtools-opener.js.map