# VSCode Extension Plan: Cursor Console Injection

## Overview
A VSCode extension that injects JavaScript code into Cursor's console (DevTools) for local development purposes. The extension will provide a simple interface to execute code in Cursor's renderer process.

## Architecture

### Core Concept
Since Cursor is built on Electron (like VS Code), we can:
1. Use Chrome DevTools Protocol (CDP) to connect to Cursor's renderer
2. Inject JavaScript code directly into the console context
3. Execute code and capture results

### Extension Structure
```
cursor-console-injector/
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── injector.ts           # Core injection logic
│   ├── cdp-client.ts         # Chrome DevTools Protocol client
│   └── ui/
│       └── webview.ts        # Webview panel for UI
├── media/
│   └── icon.svg              # Extension icon
└── README.md
```

## Implementation Approach

### 1. Extension Activation
- **Command**: `cursor-console-injector.helloWorld`
- **Activation Event**: `onCommand:cursor-console-injector.helloWorld`
- **Initial Display**: Show "Hello World" message in a webview panel

### 2. Chrome DevTools Protocol (CDP) Integration

#### Finding Cursor's Debug Port
- Cursor needs to be launched with `--remote-debugging-port=9222` (or similar)
- Alternative: Detect running Cursor instances and their debug ports
- Use `chrome-remote-interface` npm package or native CDP client

#### Connection Flow
1. Detect Cursor's debugging port (default: 9222)
2. Connect to `http://localhost:{port}/json`
3. Find the correct target (renderer process)
4. Establish WebSocket connection via CDP
5. Execute JavaScript in the console context

### 3. Code Injection Mechanism

#### Basic Injection
```typescript
// Execute JavaScript in Cursor's console
await cdpClient.Runtime.evaluate({
    expression: `console.log("Hello World from Extension!");`
});
```

#### Advanced Features
- **Message Reading**: Inject the existing payload.js to read Cursor messages
- **Input Injection**: Find and manipulate the input box DOM
- **Response Capture**: Capture console output and return to extension

### 4. Extension Manifest (package.json)

```json
{
  "name": "cursor-console-injector",
  "displayName": "Cursor Console Injector",
  "description": "Inject code into Cursor's console for local development",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onCommand:cursor-console-injector.helloWorld"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "cursor-console-injector.helloWorld",
        "title": "Hello World: Inject into Cursor Console"
      }
    ]
  }
}
```

## Implementation Steps

### Phase 1: Basic Extension Setup
1. ✅ Create extension scaffold using `yo code` or manual setup
2. ✅ Configure TypeScript build
3. ✅ Create basic command that shows "Hello World" webview
4. ✅ Test extension activation

### Phase 2: CDP Client Integration
1. ✅ Install `chrome-remote-interface` or implement native CDP client
2. ✅ Detect Cursor's debugging port
3. ✅ Connect to Cursor's renderer process
4. ✅ Test basic connection

### Phase 3: Code Injection
1. ✅ Implement `Runtime.evaluate` wrapper
2. ✅ Inject simple "Hello World" console.log
3. ✅ Verify code executes in Cursor's console
4. ✅ Capture console output

### Phase 4: Advanced Features
1. ✅ Inject existing payload.js for message reading
2. ✅ Implement input box manipulation
3. ✅ Add message extraction functionality
4. ✅ Create UI for sending/receiving messages

## Key Technical Details

### Chrome DevTools Protocol Endpoints
- **List Targets**: `GET http://localhost:9222/json`
- **WebSocket**: `ws://localhost:9222/devtools/page/{targetId}`
- **Runtime.evaluate**: Execute JavaScript in page context
- **Runtime.consoleAPICalled**: Listen to console.log output

### Finding Cursor's Debug Port
**Option 1**: Launch Cursor with flag
```bash
cursor --remote-debugging-port=9222
```

**Option 2**: Detect from process list
- Parse `ps aux | grep cursor`
- Check for `--remote-debugging-port` argument

**Option 3**: Try common ports (9222, 9223, etc.)

### Security Considerations
⚠️ **WARNING**: This extension bypasses normal security boundaries
- Only for local development
- Requires explicit user consent
- Should include warnings in UI
- Consider adding a confirmation dialog

### Error Handling
- Handle case where Cursor isn't running
- Handle case where debugging port isn't available
- Handle connection failures gracefully
- Provide clear error messages to user

## Dependencies

### Required Packages
```json
{
  "dependencies": {
    "chrome-remote-interface": "^0.33.0",
    "ws": "^8.14.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## UI Design

### Initial "Hello World" View
- Simple webview panel
- Display: "Hello World from Cursor Console Injector!"
- Button: "Inject Code"
- Status indicator: Connection status

### Future Enhanced UI
- Input field for custom JavaScript
- Display console output
- Message history viewer
- Quick actions (read messages, inject input, etc.)

## Testing Strategy

### Manual Testing
1. Launch Cursor with `--remote-debugging-port=9222`
2. Activate extension command
3. Verify "Hello World" appears
4. Verify code injection works
5. Check Cursor's console for output

### Test Scenarios
- ✅ Extension activates correctly
- ✅ CDP connection established
- ✅ Code injection succeeds
- ✅ Console output captured
- ✅ Error handling works

## Future Enhancements

### Potential Features
1. **Message Bridge**: Two-way communication between extension and Cursor
2. **Relay Integration**: Connect to existing relay-server
3. **Automation**: Automated prompt/response handling
4. **History**: Store injected code snippets
5. **Templates**: Pre-built injection scripts

## Limitations & Risks

### Known Limitations
- Requires Cursor to be launched with debugging flag
- Fragile to Cursor UI changes (DOM selectors)
- May break with Cursor updates
- Performance impact of CDP connection

### Risks
- ⚠️ Security: Bypasses normal security boundaries
- ⚠️ Stability: Could crash Cursor if code is malformed
- ⚠️ Privacy: Can access all Cursor data
- ⚠️ Terms of Service: May violate Cursor's ToS

## Development Workflow

1. **Setup**
   ```bash
   npm install
   npm run compile
   ```

2. **Launch Cursor with Debugging**
   ```bash
   cursor --remote-debugging-port=9222
   ```

3. **Test Extension**
   - Press F5 in VS Code to launch Extension Development Host
   - Run command: "Hello World: Inject into Cursor Console"
   - Verify output

4. **Package for Distribution**
   ```bash
   vsce package
   ```

## Alternative Approaches Considered

### Approach 1: VS Code Extension (Selected)
- ✅ Clean integration
- ✅ Can use VS Code APIs
- ✅ Proper extension lifecycle
- ❌ Requires CDP connection

### Approach 2: Standalone Node Script
- ✅ Simpler setup
- ✅ No extension overhead
- ❌ Less integrated with editor
- ❌ Manual execution required

### Approach 3: Browser Extension
- ✅ Could work if Cursor exposes web UI
- ❌ More complex setup
- ❌ Limited access to VS Code APIs

## Next Steps

1. **Create Extension Scaffold**
   - Run `yo code` or create manually
   - Set up TypeScript configuration

2. **Implement CDP Client**
   - Create `cdp-client.ts`
   - Implement connection logic
   - Add error handling

3. **Create Basic Injection**
   - Implement `injector.ts`
   - Add "Hello World" injection
   - Test with Cursor

4. **Build UI**
   - Create webview panel
   - Add "Hello World" display
   - Add connection status

5. **Test & Iterate**
   - Test with real Cursor instance
   - Refine error messages
   - Add documentation

## References

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)

