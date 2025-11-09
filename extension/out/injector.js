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
exports.CursorInjector = void 0;
const vscode = __importStar(require("vscode"));
const cdp_client_1 = require("./cdp-client");
class CursorInjector {
    constructor(channelName = 'Cursor Console Injector') {
        this.runtimeEnabled = false;
        this.output = vscode.window.createOutputChannel(channelName);
    }
    dispose() {
        void (0, cdp_client_1.disconnect)(this.connection);
        this.output.dispose();
    }
    async evaluate(expression, port) {
        const connection = await this.ensureConnection(port);
        const client = connection.client;
        if (!this.runtimeEnabled) {
            await client.Runtime.enable();
            client.Runtime.on('consoleAPICalled', (event) => {
                const args = event.args?.map((arg) => arg.value ?? arg.description).join(' ');
                this.output.appendLine(`[console.${event.type}] ${args ?? ''}`);
            });
            this.runtimeEnabled = true;
        }
        const evaluation = await client.Runtime.evaluate({
            expression,
            awaitPromise: true,
            returnByValue: true,
        });
        if (evaluation.exceptionDetails) {
            const message = evaluation.exceptionDetails.text ?? 'Unknown evaluation error';
            throw new Error(message);
        }
        const value = evaluation.result?.value ?? evaluation.result?.description;
        if (value !== undefined) {
            this.output.appendLine(`[result] ${String(value)}`);
        }
        return { value, description: evaluation.result?.description };
    }
    async injectHelloWorld() {
        return this.evaluate('console.log("Hello World from Cursor Console Injector!")');
    }
    async ensureConnection(port) {
        if (this.connection) {
            return this.connection;
        }
        // If port is specified, try it first; otherwise auto-scan
        if (port === undefined) {
            this.output.appendLine('Scanning for Cursor debug port...');
        }
        else {
            this.output.appendLine(`Connecting to Cursor on port ${port}...`);
        }
        this.connection = await (0, cdp_client_1.connectToCursor)({ port, autoScan: true });
        const connectedPort = this.connection.port;
        if (port !== undefined && connectedPort !== port) {
            this.output.appendLine(`Auto-detected Cursor debug port: ${connectedPort} (requested ${port} was unavailable)`);
        }
        else if (port === undefined) {
            this.output.appendLine(`Auto-detected Cursor debug port: ${connectedPort}`);
        }
        else {
            this.output.appendLine(`Connected to Cursor on port ${connectedPort}`);
        }
        this.output.appendLine(`Target: ${this.connection.target.title || this.connection.target.id}`);
        this.output.appendLine('Connected to Cursor renderer process.');
        return this.connection;
    }
}
exports.CursorInjector = CursorInjector;
//# sourceMappingURL=injector.js.map