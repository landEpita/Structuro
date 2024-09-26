import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  // Commande pour sauvegarder la structure d'un fichier ou dossier sélectionné via clic droit
  let disposableFileFolder = vscode.commands.registerCommand('extension.saveFileFolderStructure', async (uri: vscode.Uri) => {
    if (!uri) {
      vscode.window.showErrorMessage('No file or folder selected.');
      return;
    }

    const selectedPath = uri.fsPath;
    const stats = fs.statSync(selectedPath);

    let output = 'Structure and content of the selected file/folder:\n\n';

    if (stats.isDirectory()) {
      output = processDirectoryToClipboard(selectedPath, '', output);
    } else {
      output = writeFileContentToClipboard(selectedPath, '', output);
    }

    // Copie le contenu dans le presse-papiers
    await vscode.env.clipboard.writeText(output);
    vscode.window.showInformationMessage('Structure copied to clipboard!');
  });

  // Commande pour sauvegarder la structure des fichiers ouverts dans les onglets via Ctrl + Alt + S
  let disposableOpenTabs = vscode.commands.registerCommand('extension.saveOpenTabsStructure', async () => {
    const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
    if (allTabs.length === 0) {
      vscode.window.showErrorMessage('No open tabs found.');
      return;
    }

    let output = 'Structure and content of open files:\n\n';

    for (const tab of allTabs) {
      if (tab.input instanceof vscode.TabInputText) {
        const document = await vscode.workspace.openTextDocument(tab.input.uri); 
        const filePath = document.uri.fsPath;

        const relativeFilePath = vscode.workspace.asRelativePath(filePath, false);
        output += `📄 ${relativeFilePath}\n`;
        output = writeFileContentToClipboard(filePath, '  ', output);
      }
    }

    await vscode.env.clipboard.writeText(output);
    vscode.window.showInformationMessage('Structure of open tabs copied to clipboard!');
  });

  // Commande pour analyser tous les fichiers du projet via Ctrl + Alt + A
  let disposableAllFiles = vscode.commands.registerCommand('extension.analyzeAllFiles', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return;
    }

    const rootPath = workspaceFolder.uri.fsPath;
    let output = 'Project structure and code analysis:\n\n';

    output = analyzeProjectFiles(rootPath, output, rootPath, '');

    await vscode.env.clipboard.writeText(output);
    vscode.window.showInformationMessage('Project analysis copied to clipboard!');
  });

  context.subscriptions.push(disposableFileFolder);
  context.subscriptions.push(disposableOpenTabs);
  context.subscriptions.push(disposableAllFiles);
}

// Fonction pour traiter un répertoire et copier dans le presse-papiers
function processDirectoryToClipboard(dirPath: string, prefix: string, output: string): string {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);

    if (file.startsWith('.') || file.startsWith('__')) {
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    const ignoredExtensions = ['.mp3', '.mp4', '.wav', '.png', '.jpg', '.jpeg', '.gif', '.avi', '.mov', '.mkv'];
    if (ignoredExtensions.includes(ext)) {
      continue;
    }

    if (stats.isDirectory()) {
      output += `${prefix}📁 ${file}\n`;
      output = processDirectoryToClipboard(fullPath, `${prefix}  `, output);
    } else {
      output += `${prefix}📄 ${file}\n`;
      output = writeFileContentToClipboard(fullPath, `${prefix}  `, output);
    }
  }
  return output;
}

// Fonction pour écrire le contenu d'un fichier dans le presse-papiers
function writeFileContentToClipboard(filePath: string, prefix: string, output: string): string {
  if (!fs.existsSync(filePath)) {
    return output;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    output += `${prefix}--- Content of ${path.basename(filePath)} ---\n`;
    output += content;
    output += '\n--- End of content ---\n\n';
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }

  return output;
}

// Fonction pour analyser tous les fichiers d'un projet et ajouter l'indentation
function analyzeProjectFiles(dirPath: string, output: string, rootPath: string, indent: string): string {
  const files = fs.readdirSync(dirPath);

  // Liste des dossiers à ignorer
  const excludedFolders = ['node_modules', '.env', 'env'];

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(rootPath, fullPath);
    const stats = fs.statSync(fullPath);

    // Ignorer les dossiers exclus
    if (stats.isDirectory() && excludedFolders.includes(file)) {
      console.log(`Skipping excluded folder: ${file}`);
      continue;
    }

    if (stats.isDirectory()) {
      if (!file.startsWith('.') && !file.startsWith('__')) {
        output += `${indent}📁 ${relativePath}/\n`;
        // Ajouter une indentation supplémentaire pour les fichiers dans les sous-dossiers
        output = analyzeProjectFiles(fullPath, output, rootPath, indent + '  ');
      }
    } else {
      output += `${indent}📄 ${relativePath}\n`;

      // Vérifier si c'est un fichier de code et l'analyser
      const ext = path.extname(file).toLowerCase();
      const codeExtensions = ['.js', '.ts', '.py'];
      if (codeExtensions.includes(ext)) {
        output = analyzeCodeFile(fullPath, ext, output, indent + '  ');
      }
    }
  }

  return output;
}

// Fonction pour analyser un fichier de code et extraire les classes, fonctions et commentaires
function analyzeCodeFile(filePath: string, ext: string, output: string, indent: string): string {
  const content = fs.readFileSync(filePath, 'utf8');

  if (ext === '.js' || ext === '.ts') {
    output = extractJSOrTSClassesAndFunctions(content, output, indent);
  } else if (ext === '.py') {
    output = extractPythonClassesAndFunctions(content, output, indent);
  }

  return output;
}

// Fonction pour extraire les classes, fonctions et commentaires en JavaScript/TypeScript
function extractJSOrTSClassesAndFunctions(content: string, output: string, indent: string): string {
  const classRegex = /class\s+([a-zA-Z0-9_]+)\s*/g;
  const functionRegex = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*/g;
  const arrowFunctionRegex = /([a-zA-Z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>/g;

  let match;

  while ((match = classRegex.exec(content)) !== null) {
    output += `${indent}📘 Class: ${match[1]}\n`;
  }

  while ((match = functionRegex.exec(content)) !== null) {
    output += `${indent}🔧 Function: ${match[1]}(${match[2]})\n`;
  }

  while ((match = arrowFunctionRegex.exec(content)) !== null) {
    output += `${indent}🔧 Arrow Function: ${match[1]}(${match[2]})\n`;
  }

  return output;
}

// Fonction pour extraire les classes, fonctions et commentaires en Python
function extractPythonClassesAndFunctions(content: string, output: string, indent: string): string {
  const classRegex = /class\s+([a-zA-Z0-9_]+)\s*/g;
  const functionRegex = /def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*/g;

  let match;

  while ((match = classRegex.exec(content)) !== null) {
    output += `${indent}📘 Class: ${match[1]}\n`;
  }

  while ((match = functionRegex.exec(content)) !== null) {
    output += `${indent}🔧 Function: ${match[1]}(${match[2]})\n`;
  }

  return output;
}

export function deactivate() {
  console.log('Extension deactivated');
}
