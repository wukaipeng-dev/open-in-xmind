import * as vscode from 'vscode';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as child_process from 'node:child_process';

/**
 * Get the installation path of XMind based on the operating system
 */
function getXMindPath(): string | null {
  const platform = os.platform();
  
  switch (platform) {
    case 'darwin': { // macOS
      return '/Applications/XMind.app/Contents/MacOS/XMind';
    }
    case 'win32': { // Windows
      const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
      const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      
      // Check common installation paths
      const possiblePaths = [
        path.join(programFiles, 'XMind', 'XMind.exe'),
        path.join(programFilesX86, 'XMind', 'XMind.exe')
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return p;
        }
      }
      return null;
    }
    case 'linux': { // Linux
      // Common Linux installation paths
      const linuxPaths = [
        '/usr/bin/xmind',
        '/usr/local/bin/xmind',
        '/opt/xmind/XMind'
      ];
      
      for (const p of linuxPaths) {
        if (fs.existsSync(p)) {
          return p;
        }
      }
      return null;
    }
    default:
      return null;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const openInXMind = (uri: vscode.Uri) => {
    let filePath: string;
    
    // If uri is provided (context menu), use it, otherwise get the active file
    if (uri) {
      filePath = uri.fsPath;
    } else {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }
      filePath = activeEditor.document.uri.fsPath;
    }
    
    // Check if file has .xmind extension
    if (!filePath.toLowerCase().endsWith('.xmind')) {
      vscode.window.showErrorMessage('This is not an XMind file.');
      return;
    }
    
    const xmindPath = getXMindPath();
    
    if (!xmindPath) {
      vscode.window.showErrorMessage('XMind application not found. Please make sure XMind is installed on your system.');
      return;
    }
    
    try {
      const platform = os.platform();
      
      if (platform === 'darwin') {
        // macOS: Use open command
        child_process.exec(`open -a XMind "${filePath}"`);
      } else if (platform === 'win32') {
        // Windows: Use the executable path directly
        child_process.exec(`"${xmindPath}" "${filePath}"`);
      } else if (platform === 'linux') {
        // Linux: Use the executable path directly
        child_process.exec(`"${xmindPath}" "${filePath}"`);
      } else {
        vscode.window.showErrorMessage(`Unsupported platform: ${platform}`);
        return;
      }
      
      vscode.window.showInformationMessage(`Opening ${path.basename(filePath)} in XMind.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to open file in XMind: ${errorMessage}`);
    }
  };

  // Register the command to open files in XMind
  context.subscriptions.push(
    vscode.commands.registerCommand('open-in-xmind.open', (uri) => openInXMind(uri))
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
