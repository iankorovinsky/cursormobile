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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DEBUG_PORT = void 0;
exports.createLaunchWrapper = createLaunchWrapper;
exports.getDebuggingHelpMessage = getDebuggingHelpMessage;
exports.connectToCursor = connectToCursor;
exports.disconnect = disconnect;
const chrome_remote_interface_1 = __importDefault(require("chrome-remote-interface"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
exports.DEFAULT_DEBUG_PORT = 9222;
const COMMON_PORTS = [9222, 9223, 9224, 9225, 9226, 9227, 9228, 9229, 9230];
async function listTargets(port) {
    const response = await (0, node_fetch_1.default)(`http://localhost:${port}/json`);
    if (!response.ok) {
        throw new Error(`DevTools target discovery failed (HTTP ${response.status}). Ensure Cursor is running with --remote-debugging-port=${port}.`);
    }
    const data = (await response.json());
    return data;
}
/**
 * Try to enable remote debugging programmatically via Electron APIs
 * This only works if we're running in an Electron context (extension host)
 */
async function tryEnableDebuggingProgrammatically() {
    try {
        // Try to access Electron's app object from the extension host
        // @ts-ignore - Electron APIs may not be in types
        const electron = require('electron');
        if (electron && electron.app) {
            // Try to append the switch (must be done before app is ready)
            // @ts-ignore
            electron.app.commandLine.appendSwitch('remote-debugging-port', '9222');
            return 9222;
        }
    }
    catch (error) {
        // Electron APIs not available, continue with other methods
    }
    // Try alternative: check if we can access process.env or global Electron
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
            // We're in Electron, but can't modify flags after launch
            // Return null to try other methods
        }
    }
    catch (error) {
        // Not in Electron context
    }
    return null;
}
/**
 * Try to detect Cursor's debug port from process arguments (macOS/Linux)
 */
async function detectCursorDebugPort() {
    try {
        const { stdout } = await execAsync('ps aux | grep -i cursor | grep -v grep');
        const lines = stdout.split('\n').filter(line => line.trim());
        for (const line of lines) {
            // Look for --remote-debugging-port=XXXX pattern
            const match = line.match(/--remote-debugging-port=(\d+)/);
            if (match) {
                const port = parseInt(match[1], 10);
                if (port > 0) {
                    return port;
                }
            }
        }
    }
    catch (error) {
        // Process detection failed, continue with port scanning
        console.warn('Failed to detect Cursor debug port from process:', error);
    }
    return null;
}
/**
 * Create a launch wrapper script for macOS that launches Cursor with debugging enabled
 */
async function createLaunchWrapper() {
    const platform = os.platform();
    let scriptContent = '';
    let scriptPath = '';
    if (platform === 'darwin') {
        // macOS: Create an AppleScript or shell script wrapper
        scriptContent = `#!/bin/bash
# Launch Cursor with remote debugging enabled
# Usage: ./launch-cursor-debug.sh

# Find Cursor.app
CURSOR_APP="/Applications/Cursor.app"
if [ ! -d "$CURSOR_APP" ]; then
    CURSOR_APP="\$(mdfind -name Cursor.app | head -1)"
fi

if [ -z "$CURSOR_APP" ] || [ ! -d "$CURSOR_APP" ]; then
    echo "Error: Could not find Cursor.app"
    echo "Please install Cursor or update the path in this script"
    exit 1
fi

# Launch with debugging port
open -a "$CURSOR_APP" --args --remote-debugging-port=9222

echo "Cursor launched with remote debugging on port 9222"
echo "You can now use the extension to connect."
`;
        scriptPath = path.join(os.homedir(), 'launch-cursor-debug.sh');
    }
    else if (platform === 'linux') {
        scriptContent = `#!/bin/bash
# Launch Cursor with remote debugging enabled
# Usage: ./launch-cursor-debug.sh

cursor --remote-debugging-port=9222 "$@"
`;
        scriptPath = path.join(os.homedir(), 'launch-cursor-debug.sh');
    }
    else if (platform === 'win32') {
        scriptContent = `@echo off
REM Launch Cursor with remote debugging enabled
REM Usage: launch-cursor-debug.bat

cursor --remote-debugging-port=9222 %*
`;
        scriptPath = path.join(os.homedir(), 'launch-cursor-debug.bat');
    }
    else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
    await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });
    return scriptPath;
}
/**
 * Try to connect to a specific port, return null if it fails
 */
async function tryPort(port, timeoutMs = 1000) {
    try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), timeoutMs);
        });
        // Race between fetch and timeout
        const response = await Promise.race([
            (0, node_fetch_1.default)(`http://localhost:${port}/json`),
            timeoutPromise,
        ]);
        if (!response.ok) {
            return null;
        }
        const data = (await response.json());
        return data.length > 0 ? data : null;
    }
    catch (error) {
        return null;
    }
}
/**
 * Scan common ports to find an active debug port
 */
async function scanForDebugPort() {
    // First, try to detect from process
    const detectedPort = await detectCursorDebugPort();
    if (detectedPort) {
        try {
            const targets = await listTargets(detectedPort);
            if (targets.length > 0) {
                return { port: detectedPort, targets };
            }
        }
        catch (error) {
            // Continue to port scanning
        }
    }
    // Try common ports in parallel (with timeout to avoid long waits)
    const portPromises = COMMON_PORTS.map(async (port) => {
        const targets = await tryPort(port, 500); // 500ms timeout per port
        return targets ? { port, targets } : null;
    });
    const results = await Promise.all(portPromises);
    const found = results.find(result => result !== null);
    return found || null;
}
/**
 * Check if Cursor might have debugging enabled but we haven't found it yet
 * Returns helpful error message with suggestions
 */
function getDebuggingHelpMessage() {
    const platform = os.platform();
    let launchInstructions = '';
    if (platform === 'darwin') {
        launchInstructions = `
macOS Launch Options:
1. Create a launch wrapper script (run the command: "Cursor Console Injector: Create Launch Script")
2. Or manually launch from terminal:
   open -a Cursor.app --args --remote-debugging-port=9222
3. Or modify Cursor's Info.plist (advanced):
   Add to LSArguments: --remote-debugging-port=9222
`;
    }
    else if (platform === 'linux') {
        launchInstructions = `
Linux Launch Options:
1. Launch from terminal: cursor --remote-debugging-port=9222
2. Or create a desktop entry with the flag
`;
    }
    else if (platform === 'win32') {
        launchInstructions = `
Windows Launch Options:
1. Launch from command prompt: cursor --remote-debugging-port=9222
2. Or create a shortcut with the flag added to Target
`;
    }
    return `Cursor remote debugging is not enabled. ${launchInstructions}`;
}
function pickRendererTarget(targets) {
    const byType = targets.find((target) => target.type === 'page' || target.type === 'renderer');
    if (byType) {
        return byType;
    }
    return targets[0];
}
async function connectToCursor(options) {
    const requestedPort = options?.port;
    const autoScan = options?.autoScan !== false; // Default to true
    let port;
    let targets;
    // If a specific port was requested, try it first
    if (requestedPort !== undefined) {
        try {
            targets = await listTargets(requestedPort);
            if (targets.length > 0) {
                port = requestedPort;
            }
            else {
                throw new Error('No targets found on requested port');
            }
        }
        catch (error) {
            // If auto-scan is enabled and the requested port failed, try scanning
            if (autoScan) {
                const scanned = await scanForDebugPort();
                if (scanned) {
                    port = scanned.port;
                    targets = scanned.targets;
                }
                else {
                    const helpMessage = getDebuggingHelpMessage();
                    throw new Error(`Failed to connect to port ${requestedPort} and no other debug ports found.\n\n${helpMessage}`);
                }
            }
            else {
                const message = error instanceof Error
                    ? error.message
                    : `Unable to reach DevTools target listing on port ${requestedPort}`;
                throw new Error(message);
            }
        }
    }
    else {
        // No port specified, try scanning
        const scanned = await scanForDebugPort();
        if (!scanned) {
            const helpMessage = getDebuggingHelpMessage();
            throw new Error(`No Cursor debug port found.\n\n${helpMessage}\n\n` +
                `The extension will automatically detect the port once Cursor is launched with debugging enabled.`);
        }
        port = scanned.port;
        targets = scanned.targets;
    }
    if (!targets.length) {
        throw new Error('No debuggable targets detected. Launch Cursor with remote debugging enabled.');
    }
    const target = options?.selectTarget?.(targets) ?? pickRendererTarget(targets);
    if (!target) {
        throw new Error('Unable to determine which Cursor target to connect to.');
    }
    const client = await (0, chrome_remote_interface_1.default)({
        host: 'localhost',
        port,
        target: target.id,
    });
    return { client, target, port };
}
async function disconnect(connection) {
    if (!connection) {
        return;
    }
    try {
        await connection.client.close();
    }
    catch (error) {
        // Ignore errors during shutdown.
        console.warn('Failed to close CDP connection', error);
    }
}
//# sourceMappingURL=cdp-client.js.map