import * as vscode from 'vscode';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * Get the installation path of XMind based on the operating system
 * This is used for checking if XMind is installed, but not for execution
 */
function isXMindInstalled(): boolean {
  const platform = os.platform();
  console.log(`Detected platform: ${platform}`);

  switch (platform) {
    case 'darwin': {
      // macOS
      const exists = fs.existsSync('/Applications/XMind.app');
      console.log(`Checking XMind installation on macOS: ${exists}`);
      return exists;
    }
    case 'win32': {
      // Windows
      const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
      const programFilesX86 =
        process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

      // Check common installation paths
      const possiblePaths = [
        path.join(programFiles, 'XMind', 'XMind.exe'),
        path.join(programFilesX86, 'XMind', 'XMind.exe'),
      ];

      for (const p of possiblePaths) {
        console.log(`Checking XMind installation at: ${p}`);
        if (fs.existsSync(p)) {
          console.log('XMind found on Windows.');
          return true;
        }
      }
      console.log('XMind not found on Windows.');
      return false;
    }
    case 'linux': {
      // Linux
      const linuxPaths = [
        '/usr/bin/xmind',
        '/usr/local/bin/xmind',
        '/opt/xmind/XMind',
      ];

      for (const p of linuxPaths) {
        console.log(`Checking XMind installation at: ${p}`);
        if (fs.existsSync(p)) {
          console.log('XMind found on Linux.');
          return true;
        }
      }
      console.log('XMind not found on Linux.');
      return false;
    }
    default:
      console.log('Unsupported platform.');
      return false;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Activating open-in-xmind extension.');

  // Create a terminal for running XMind commands
  const terminal = vscode.window.createTerminal({
    name: 'XMind',
    hideFromUser: true,
  });

  const openInXMind = (uri?: vscode.Uri) => {
    console.log('openInXMind command invoked.');

    let filePath: string;

    // If uri is provided (context menu), use it, otherwise get the active file
    if (uri) {
      filePath = uri.fsPath;
      console.log(`URI provided: ${filePath}`);
    } else {
      // Try to get active document
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        filePath = activeEditor.document.uri.fsPath;
        console.log(`Active editor file path: ${filePath}`);
      } else {
        // If no active editor, try to find the active document in explorer view
        const visibleEditors = vscode.window.visibleTextEditors;
        if (visibleEditors.length > 0) {
          filePath = visibleEditors[0].document.uri.fsPath;
          console.log(`Using visible editor file path: ${filePath}`);
        } else {
          // Show file picker to select a file
          console.log('No active or visible editor found. Please select a .xmind file.');
          vscode.window.showErrorMessage('Please open a .xmind file or select one in the explorer.');
          return;
        }
      }
    }

    // Check if file has .xmind extension
    if (!filePath.toLowerCase().endsWith('.xmind')) {
      vscode.window.showErrorMessage('This is not an XMind file.');
      console.error('File is not an XMind file.');
      return;
    }

    // Check if XMind is installed
    if (!isXMindInstalled()) {
      vscode.window.showErrorMessage(
        'XMind application not found. Please make sure XMind is installed on your system.'
      );
      console.error('XMind application not found.');
      return;
    }

    try {
      const platform = os.platform();
      console.log(`Platform for execution: ${platform}`);

      // Use terminal to send the command, which works more reliably for launching applications
      if (platform === 'darwin') {
        // macOS: Use open command with the application name
        terminal.sendText(`open -a XMind "${filePath}"`);
        console.log(`Command sent to terminal: open -a XMind "${filePath}"`);
      } else if (platform === 'win32') {
        // Windows: Use start command
        terminal.sendText(`start "" xmind "${filePath}"`);
        console.log(`Command sent to terminal: start "" xmind "${filePath}"`);
      } else if (platform === 'linux') {
        // Linux
        terminal.sendText(`xmind "${filePath}"`);
        console.log(`Command sent to terminal: xmind "${filePath}"`);
      } else {
        vscode.window.showErrorMessage(`Unsupported platform: ${platform}`);
        console.error(`Unsupported platform: ${platform}`);
        return;
      }

      vscode.window.showInformationMessage(
        `Opening ${path.basename(filePath)} in XMind.`
      );
      console.log(`Opening ${path.basename(filePath)} in XMind.`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Failed to open file in XMind: ${errorMessage}`
      );
      console.error(`Error occurred: ${errorMessage}`);
    }
  };

  // Register the command to open files in XMind
  context.subscriptions.push(
    vscode.commands.registerCommand('open-in-xmind.open', (uri) =>
      openInXMind(uri)
    )
  );

  console.log('open-in-xmind extension activated.');
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log('Deactivating open-in-xmind extension.');
}
