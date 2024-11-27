// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Starting activation of taschedule extension...');
	console.log('Extension path:', context.extensionPath);
	console.log('Subscriptions count:', context.subscriptions.length);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('taschedule.helloWorld', () => {
		console.log('Executing helloWorld command...');
		vscode.window.showInformationMessage('Hello World from taschedule!');
	});

	context.subscriptions.push(disposable);
	console.log('Extension activation completed!');
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Extension is being deactivated');
}
