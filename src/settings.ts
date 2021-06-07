import * as vscode from "vscode";

/**
 * Gets the current componentId
 */
export async function getComponentId(): Promise<string | null> {
	return new Promise((resolve, reject) => {
		const id = vscode.workspace.getConfiguration("ccims").get("componentId") as string | null;
		console.log(id);
		resolve(id);
	});
}