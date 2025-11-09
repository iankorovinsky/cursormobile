# Cursor Console Injector VS Code Extension

A simple VS Code extension that provides copyable `console.log` snippets for Cursor's DevTools console. No CDP connection needed - just copy, paste, and run!

## Features

- **Three pre-made console.log snippets** ready to copy
- **One-click copy buttons** for each snippet
- **Auto-open DevTools button** - automatically opens Cursor's DevTools (macOS/Windows/Linux)

## Prerequisites

- Node.js 16+ and npm
- VS Code 1.80.0 or newer
- Cursor installed

## Setup

```bash
cd cursormobile/extension
npm install
npm run compile
```

## Running in VS Code

1. Open the `cursormobile/extension` folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. In the new VS Code window, press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux).
4. Type: **"Open Console Snippets"**
5. Select: **"Open Console Snippets: Show copyable console.log snippets"**
6. A webview panel appears with:
   - **Three code boxes** with `console.log` examples
   - **Copy buttons** for each snippet
   - **"Open Cursor DevTools" button** to automatically open DevTools

## How to Use

1. Click **"Copy"** on any code box → code is copied to clipboard
2. Click **"Open Cursor DevTools"** → DevTools opens automatically (or press `Cmd+Option+I` / `Ctrl+Shift+I` manually)
3. Go to the **Console** tab in DevTools
4. Paste (`Cmd+V` / `Ctrl+V`) and press **Enter** to execute

That's it! No special launch flags or CDP connections needed.

## Packaging

```bash
npm run compile
vsce package
```

This produces a `.vsix` you can install using `code --install-extension <file>.vsix`.
