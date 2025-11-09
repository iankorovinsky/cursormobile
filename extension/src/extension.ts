import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';
import { openSnippetsPanel } from './ui/webview';

// Load .env file from extension root directory
// __dirname points to out/ directory in compiled code, so go up one level
const extensionRoot = path.resolve(__dirname, '..');
const envPath = path.join(extensionRoot, '.env');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
  console.log(`Loaded .env file from: ${envPath}`);
} else {
  console.log(`No .env file found at: ${envPath}`);
}

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'cursor-console-injector.helloWorld',
    () => {
      openSnippetsPanel(context);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  // No cleanup needed
}
