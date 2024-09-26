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
    // Commande pour sauvegarder la structure d'un fichier ou dossier sélectionné via clic droit
    let disposableFileFolder = vscode.commands.registerCommand('extension.saveFileFolderStructure', async (uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('No file or folder selected.');
            return;
        }
        const selectedPath = uri.fsPath;
        const stats = fs.statSync(selectedPath);
        let output = 'Structure and content of the selected file/folder:\n\n';
        if (stats.isDirectory()) {
            // Si c'est un dossier, on traite tout le répertoire
            output = processDirectoryToClipboard(selectedPath, '', output);
        }
        else {
            // Si c'est un fichier, on écrit son contenu
            output = writeFileContentToClipboard(selectedPath, '', output);
        }
        // Copie le contenu dans le presse-papiers
        await vscode.env.clipboard.writeText(output);
        vscode.window.showInformationMessage('Structure copied to clipboard!');
    });
    // Commande pour sauvegarder la structure des fichiers ouverts dans les onglets via Ctrl + Alt + S
    let disposableOpenTabs = vscode.commands.registerCommand('extension.saveOpenTabsStructure', async () => {
        const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
        console.log(`Number of open tabs: ${allTabs.length}`);
        if (allTabs.length === 0) {
            vscode.window.showErrorMessage('No open tabs found.');
            return;
        }
        let output = 'Structure and content of open files:\n\n';
        for (const tab of allTabs) {
            if (tab.input instanceof vscode.TabInputText) {
                const document = await vscode.workspace.openTextDocument(tab.input.uri); // Ouvre le document associé à l'onglet
                const filePath = document.uri.fsPath;
                // Obtenir le chemin relatif du fichier par rapport à la racine du projet
                const relativeFilePath = vscode.workspace.asRelativePath(filePath, false);
                console.log(`Processing file: ${relativeFilePath}`);
                try {
                    output += `📄 ${relativeFilePath}\n`;
                    output = writeFileContentToClipboard(filePath, '  ', output);
                }
                catch (error) {
                    console.error(`Error processing file ${filePath}:`, error);
                    vscode.window.showErrorMessage(`Error processing file: ${filePath}`);
                }
            }
            else {
                console.warn(`Skipping non-file resource: ${tab.label}`);
                vscode.window.showWarningMessage(`Skipping non-file resource: ${tab.label}`);
            }
        }
        // Copie le contenu dans le presse-papiers
        await vscode.env.clipboard.writeText(output);
        vscode.window.showInformationMessage('Structure of open tabs copied to clipboard!');
    });
    // Commande pour parcourir tous les fichiers du projet et extraire classes/fonctions via Ctrl + Alt + A
    let disposableAllFiles = vscode.commands.registerCommand('extension.analyzeAllFiles', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]; // Dossier racine du projet
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }
        const rootPath = workspaceFolder.uri.fsPath;
        let output = 'Classes and Functions in the project:\n\n';
        // Parcourir tous les fichiers du projet
        output = analyzeProjectFiles(rootPath, output);
        // Copie le contenu dans le presse-papiers
        await vscode.env.clipboard.writeText(output);
        vscode.window.showInformationMessage('Project analysis copied to clipboard!');
    });
    // Ajoute les commandes aux abonnements
    context.subscriptions.push(disposableFileFolder);
    context.subscriptions.push(disposableOpenTabs);
    context.subscriptions.push(disposableAllFiles);
}
// Fonction pour traiter un répertoire et copier dans le presse-papiers
function processDirectoryToClipboard(dirPath, prefix, output) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        // Ignorer les dossiers et fichiers cachés (ceux qui commencent par '.' ou '__')
        if (file.startsWith('.') || file.startsWith('__')) {
            console.log(`Skipping hidden/config folder: ${file}`);
            continue; // Passe au fichier ou dossier suivant
        }
        // Ignorer les fichiers multimédias (images, vidéos, sons)
        const ext = path.extname(file).toLowerCase();
        const ignoredExtensions = ['.mp3', '.mp4', '.wav', '.png', '.jpg', '.jpeg', '.gif', '.avi', '.mov', '.mkv'];
        if (ignoredExtensions.includes(ext)) {
            console.log(`Skipping multimedia file: ${file}`);
            continue; // Passe au fichier suivant
        }
        if (stats.isDirectory()) {
            output += `${prefix}📁 ${file}\n`;
            output = processDirectoryToClipboard(fullPath, `${prefix}  `, output);
        }
        else {
            output += `${prefix}📄 ${file}\n`;
            output = writeFileContentToClipboard(fullPath, `${prefix}  `, output);
        }
    }
    return output;
}
// Fonction pour écrire le contenu d'un fichier dans le presse-papiers
function writeFileContentToClipboard(filePath, prefix, output) {
    if (!fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(`File not found: ${filePath}`);
        console.error(`File not found: ${filePath}`);
        return output;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Reading file: ${filePath}, content length: ${content.length}`);
        output += `${prefix}--- Content of ${path.basename(filePath)} ---\n`;
        output += content.substring(0, 1000); // Limite à 1000 caractères
        output += '\n--- End of content ---\n\n';
    }
    catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Error reading file ${filePath}: ${error.message}`);
        }
        else {
            vscode.window.showErrorMessage(`Unknown error reading file ${filePath}`);
        }
    }
    return output;
}
// Fonction pour analyser tous les fichiers d'un projet
function analyzeProjectFiles(dirPath, output) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            // Ignorer les dossiers cachés et ceux qui commencent par "__"
            if (!file.startsWith('.') && !file.startsWith('__')) {
                output = analyzeProjectFiles(fullPath, output);
            }
        }
        else {
            // Ignorer les fichiers multimédias
            const ext = path.extname(file).toLowerCase();
            const codeExtensions = ['.js', '.ts', '.py'];
            if (codeExtensions.includes(ext)) {
                output += `\n📄 ${file}:\n`;
                output = analyzeCodeFile(fullPath, ext, output);
            }
        }
    }
    return output;
}
// Fonction pour analyser un fichier de code et extraire les classes, fonctions et commentaires
function analyzeCodeFile(filePath, ext, output) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (ext === '.js' || ext === '.ts' || ext === '.tsx') {
        output = extractJSOrTSClassesAndFunctions(content, output);
    }
    else if (ext === '.py') {
        output = extractPythonClassesAndFunctions(content, output);
    }
    return output;
}
// Fonction pour extraire les classes, fonctions et commentaires en JavaScript/TypeScript
function extractJSOrTSClassesAndFunctions(content, output) {
    const classRegex = /class\s+([a-zA-Z0-9_]+)\s*/g;
    const functionRegex = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*/g;
    const arrowFunctionRegex = /([a-zA-Z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>/g;
    let match;
    // Extraire les classes
    while ((match = classRegex.exec(content)) !== null) {
        output += `  📘 Class: ${match[1]}\n`;
    }
    // Extraire les fonctions classiques
    while ((match = functionRegex.exec(content)) !== null) {
        output += `  🔧 Function: ${match[1]}(${match[2]})\n`;
    }
    // Extraire les fonctions fléchées
    while ((match = arrowFunctionRegex.exec(content)) !== null) {
        output += `  🔧 Arrow Function: ${match[1]}(${match[2]})\n`;
    }
    return output;
}
// Fonction pour extraire les classes, fonctions et commentaires en Python
function extractPythonClassesAndFunctions(content, output) {
    const classRegex = /class\s+([a-zA-Z0-9_]+)\s*/g;
    const functionRegex = /def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*/g;
    let match;
    // Extraire les classes
    while ((match = classRegex.exec(content)) !== null) {
        output += `  📘 Class: ${match[1]}\n`;
    }
    // Extraire les fonctions
    while ((match = functionRegex.exec(content)) !== null) {
        output += `  🔧 Function: ${match[1]}(${match[2]})\n`;
    }
    return output;
}
function deactivate() {
    console.log('Extension deactivated');
}
//# sourceMappingURL=old.js.map