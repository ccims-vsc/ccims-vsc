import * as vscode from "vscode";
import { CCIMSCommand } from "../commands/CCIMSCommand";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";

/**
 * Gets the current componentId
 */
export function getComponentId(): string|null {
	if (!vscode.workspace.workspaceFolders) {
		return null;
	}

	const id = vscode.workspace.getConfiguration("ccims").get("componentId") as string | null;
	if (!id) {
		return null;
	} else {
		return id;
	}
}

/**
 * Called on initialization to init all settings listeners
 */
export function initSettingsListener(): void {
	vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration("ccims.componentId")) {
			vscode.commands.executeCommand(CCIMSCommandType.COMPONENT_ID_CHANGED);
		}
		if (e.affectsConfiguration("ccims.apiUrl")) {
			vscode.commands.executeCommand(CCIMSCommandType.API_URL_CHANGED);
		}
	})
}