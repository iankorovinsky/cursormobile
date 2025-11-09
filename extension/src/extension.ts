import * as vscode from 'vscode';
import { openSnippetsPanel } from './ui/webview';

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
