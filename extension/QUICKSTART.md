# Quick Start Guide - Extension Development

## Step-by-Step Instructions

### 1. Open the Extension Folder in VS Code
```bash
cd /Users/iankorovinsky/hackutd/cursormobile/extension
code .
```

### 2. Compile the Extension (if needed)
```bash
npm run compile
```

### 3. Start Extension Development

**Option A: Using the Debug Panel**
1. Click the **Run and Debug** icon in the sidebar (or press `Cmd+Shift+D` / `Ctrl+Shift+D`)
2. Select **"Run Extension"** from the dropdown at the top
3. Click the green play button (or press `F5`)

**Option B: Using Keyboard Shortcut**
- Simply press **`F5`** - this will automatically:
  - Compile TypeScript
  - Launch Extension Development Host

### 4. What Should Happen

When you press F5:
1. VS Code will compile your TypeScript code
2. A new **Extension Development Host** window will open
3. This new window has your extension loaded

### 5. Test Your Extension

In the **Extension Development Host** window:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: **"Hello World"**
3. Select: **"Hello World: Inject into Cursor Console"**
4. A webview panel should appear!

### 6. Debugging

**To see debug logs:**
- In the **main VS Code window** (where you pressed F5):
  - Open **View → Debug Console** to see console.log output
  - Open **View → Output** → Select **"Cursor Console Injector Debug"** from dropdown

**To stop debugging:**
- Close the Extension Development Host window, or
- Press `Shift+F5` in the main VS Code window

### Troubleshooting

**Extension Development Host doesn't open:**
1. Check the **Debug Console** in the main VS Code window for errors
2. Check **View → Output → Log (Extension Host)** for errors
3. Make sure TypeScript compiled: `npm run compile`
4. Try closing all VS Code windows and reopening

**Command doesn't appear:**
1. Make sure you're in the **Extension Development Host** window (not the main one)
2. Reload the window: `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux)
3. Check that the extension activated - look for notification messages

**Need to reload extension:**
- In Extension Development Host: `Cmd+R` / `Ctrl+R`
- Or close and press F5 again

### Useful Commands

```bash
# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Package extension for distribution
npm run package
```

