import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DevToolsOpener {
  async openDevTools(): Promise<void> {
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
      } else if (platform === 'win32') {
        await execAsync(`powershell -Command "& {Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::AppActivate('Cursor'); Start-Sleep -Milliseconds 300; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^+{I}')}"`);
        vscode.window.showInformationMessage('DevTools opened! Go to the Console tab.');
      } else {
        try {
          await execAsync('xdotool search --name "Cursor" windowactivate key ctrl+shift+i');
          vscode.window.showInformationMessage('DevTools opened! Go to the Console tab.');
        } catch {
          vscode.window.showWarningMessage(
            'Could not open DevTools automatically. Please press Ctrl+Shift+I manually in Cursor.'
          );
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showWarningMessage(
        `Could not open DevTools automatically: ${errorMessage}. ` +
        `Please press Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux) manually in Cursor.`
      );
    }
  }
}

