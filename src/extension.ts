import * as vscode from "vscode";
import { IssueViewProvider } from "./issue-view/IssueViewProvider";

export function activate(context: vscode.ExtensionContext) {
	console.log("activate");

	const provider = new IssueViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(IssueViewProvider.viewType, provider));
}


