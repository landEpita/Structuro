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
    // Commande pour sauvegarder la structure des fichiers ouverts dans les onglets
    let disposableOpenTabs = vscode.commands.registerCommand('extension.saveOpenTabsStructure', async () => {
        // Récupère tous les onglets ouverts, pas seulement les éditeurs visibles
        const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
        console.log(`Number of open tabs: ${allTabs.length}`);
        if (allTabs.length === 0) {
            vscode.window.showErrorMessage('No open tabs found.');
            return;
        }
        // Détermine où sauvegarder le fichier de sortie (dans le premier dossier du workspace si possible)
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]; // Dossier racine du projet
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }
        const outputFilePath = path.join(workspaceFolder.uri.fsPath, 'open_tabs_structure_output.txt');
        console.log(`Output file for open tabs: ${outputFilePath}`);
        // Supprime le fichier de sortie précédent s'il existe pour s'assurer qu'il soit vide
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }
        const writeStream = fs.createWriteStream(outputFilePath, { flags: 'a' }); // Le 'a' permet d'ajouter les fichiers sans écraser le contenu
        writeStream.write('Structure and content of open files:\n\n');
        for (const tab of allTabs) {
            // Vérifie si l'onglet est associé à un fichier sur le disque
            if (tab.input instanceof vscode.TabInputText) {
                const document = await vscode.workspace.openTextDocument(tab.input.uri); // Ouvre le document associé à l'onglet
                const filePath = document.uri.fsPath;
                // Obtenir le chemin relatif du fichier par rapport à la racine du projet
                const relativeFilePath = vscode.workspace.asRelativePath(filePath, false);
                console.log(`Processing file: ${relativeFilePath}`);
                try {
                    // Écrire le chemin relatif dans le fichier
                    writeStream.write(`📄 ${relativeFilePath}\n`);
                    // Lire le contenu et l'écrire dans le stream
                    writeFileContent(filePath, '  ', writeStream);
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
        // Fermer le stream après avoir traité tous les fichiers
        writeStream.end(() => {
            console.log(`All files processed. Structure of open tabs saved to ${outputFilePath}`);
            vscode.window.showInformationMessage(`Structure of open tabs saved to ${outputFilePath}`);
        });
    });
    context.subscriptions.push(disposableOpenTabs);
}
function writeFileContent(filePath, prefix, writeStream) {
    if (!fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(`File not found: ${filePath}`);
        console.error(`File not found: ${filePath}`);
        return;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Reading file: ${filePath}, content length: ${content.length}`);
        writeStream.write(`${prefix}--- Content of ${path.basename(filePath)} ---\n`);
        writeStream.write(content.substring(0, 1000)); // Limite à 1000 caractères
        writeStream.write('\n--- End of content ---\n\n');
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
}
function deactivate() {
    console.log('Extension deactivated');
}
//# sourceMappingURL=ctr.js.map