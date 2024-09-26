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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    // Register the command that gets invoked when user clicks on Save File/Folder Structure
    let disposable = vscode.commands.registerCommand('extension.saveFileFolderStructure', async (uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('No file or folder selected.');
            return;
        }
        const selectedPath = uri.fsPath;
        const stats = fs.statSync(selectedPath);
        const outputFilePath = path.join(path.dirname(selectedPath), 'structure_output.txt');
        const writeStream = fs.createWriteStream(outputFilePath, { flags: 'w' });
        writeStream.write('Structure and content of the selected file/folder:\n\n');
        if (stats.isDirectory()) {
            // If it's a folder, process the directory
            processDirectory(selectedPath, '', writeStream);
        }
        else {
            // If it's a file, write the file's content
            writeFileContent(selectedPath, '', writeStream);
        }
        writeStream.end();
        vscode.window.showInformationMessage(`Structure saved to ${outputFilePath}`);
    });
    context.subscriptions.push(disposable);
}
function processDirectory(dirPath, prefix, writeStream) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            writeStream.write(`${prefix}📁 ${file}\n`);
            processDirectory(fullPath, `${prefix}`, writeStream);
        }
        else {
            writeStream.write(`${prefix}📄 ${file}\n`);
            writeFileContent(fullPath, `${prefix}`, writeStream);
        }
    }
}
function writeFileContent(filePath, prefix, writeStream) {
    const content = fs.readFileSync(filePath, 'utf8');
    writeStream.write(`${prefix}--- Content of ${path.basename(filePath)} ---\n`);
    writeStream.write(content.substring(0, 1000)); // Limit to 1000 characters
    writeStream.write('\n--- End of content ---\n\n');
}
function deactivate() { }
//# sourceMappingURL=test.js.map