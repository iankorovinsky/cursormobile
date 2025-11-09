# Alternatives to Launching Cursor with --remote-debugging-port

Since you can't launch Cursor directly with the `--remote-debugging-port` flag, here are several workarounds:

## Option 1: Use the Launch Script Generator (Recommended)

The extension includes a command to generate a launch script for your platform:

1. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Run: **"Create Launch Script: Generate script to launch Cursor with debugging"**
3. This creates a script in your home directory:
   - **macOS**: `~/launch-cursor-debug.sh`
   - **Linux**: `~/launch-cursor-debug.sh`
   - **Windows**: `~/launch-cursor-debug.bat`
4. Use this script to launch Cursor instead of the regular app

### macOS Usage:
```bash
chmod +x ~/launch-cursor-debug.sh
~/launch-cursor-debug.sh
```

### Linux Usage:
```bash
chmod +x ~/launch-cursor-debug.sh
~/launch-cursor-debug.sh
```

### Windows Usage:
Double-click `launch-cursor-debug.bat` or run from command prompt.

## Option 2: Manual Terminal Launch (macOS/Linux)

Launch Cursor from terminal with the flag:

```bash
# macOS
open -a Cursor.app --args --remote-debugging-port=9222

# Linux
cursor --remote-debugging-port=9222
```

## Option 3: Modify Cursor's Info.plist (macOS - Advanced)

**Warning**: This modifies Cursor's application bundle and may be overwritten by updates.

1. Right-click Cursor.app → "Show Package Contents"
2. Navigate to `Contents/Info.plist`
3. Find the `LSArguments` array (or create it if it doesn't exist)
4. Add: `--remote-debugging-port=9222`
5. Save and restart Cursor

Example Info.plist entry:
```xml
<key>LSArguments</key>
<array>
    <string>--remote-debugging-port=9222</string>
</array>
```

## Option 4: Create a Desktop Shortcut/Launcher

### macOS:
Create an Automator app or AppleScript that runs:
```applescript
do shell script "open -a Cursor.app --args --remote-debugging-port=9222"
```

### Windows:
Create a shortcut and modify the Target to include the flag:
```
"C:\Path\To\Cursor.exe" --remote-debugging-port=9222
```

## Option 5: Auto-Detection (Already Implemented)

The extension now automatically:
- Scans common debug ports (9222-9230)
- Detects Cursor's debug port from process arguments
- Falls back to port scanning if the specified port fails

Just leave the port field empty or use the default, and the extension will try to find Cursor's debug port automatically.

## Troubleshooting

### "No Cursor debug port found"
- Ensure Cursor is running with `--remote-debugging-port` enabled
- Check that Cursor is actually running
- Try manually specifying a port in the UI

### "Connection refused"
- Cursor might not be running with debugging enabled
- Another app might be using the port
- Try a different port number

### Port Already in Use
- Try a different port (e.g., 9223, 9224)
- Close other Electron apps that might be using the port
- Check what's using the port: `lsof -i :9222` (macOS/Linux)

## Notes

- **Security**: Remote debugging exposes Cursor's internals. Only use on trusted networks.
- **Updates**: Launch scripts and Info.plist modifications may need to be recreated after Cursor updates.
- **Performance**: Remote debugging adds minimal overhead but may slightly impact performance.

