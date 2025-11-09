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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dotenv_1 = require("dotenv");
const webview_1 = require("./ui/webview");
// Load .env file from extension root directory
// __dirname points to out/ directory in compiled code, so go up one level
const extensionRoot = path.resolve(__dirname, '..');
const envPath = path.join(extensionRoot, '.env');
if (fs.existsSync(envPath)) {
    (0, dotenv_1.config)({ path: envPath });
    console.log(`Loaded .env file from: ${envPath}`);
}
else {
    console.log(`No .env file found at: ${envPath}`);
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('cursor-console-injector.helloWorld', () => {
        (0, webview_1.openSnippetsPanel)(context);
    });
    context.subscriptions.push(disposable);
}
function deactivate() {
    // No cleanup needed
}
//# sourceMappingURL=extension.js.map