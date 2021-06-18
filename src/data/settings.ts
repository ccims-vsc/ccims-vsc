import * as vscode from "vscode";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";

/**
 * Gets the api url
 */
export function getApiUrl(): string | undefined {
	const url = vscode.workspace.getConfiguration("ccims").get("url");
	if (url) {
		return url + "/api";
	} else {
		return undefined;
	}
}

/**
 * Gets the login url
 */
export function getLoginUrl(): string | undefined {
	const url = vscode.workspace.getConfiguration("ccims").get("url");
	if (url) {
		return url + "/login";
	} else {
		return undefined;
	}
}

export function getPublicApiUrl(): string | undefined {
	const url = vscode.workspace.getConfiguration("ccims").get("url");
	if (url) {
		return url + "/api/public";
	} else {
		return undefined;
	}
}

/**
 * Sets the api url
 * @param url the new api url
 */
export async function setApiUrl(url: string): Promise<void> {
	const configuration = vscode.workspace.getConfiguration("ccims");
	await configuration.update("url", url, vscode.ConfigurationTarget.Global);
}

/**
 * Gets the current componentId
 */
export function getComponentId(): string | undefined {
	if (!vscode.workspace.workspaceFolders) {
		return undefined;
	}

	const id = vscode.workspace.getConfiguration("ccims").get("componentId") as string | undefined;
	if (!id) {
		return undefined;
	} else {
		return id;
	}
}

/**
 * Sets the component id
 * @param id the id of the new component
 */
export async function setComponentId(id: string): Promise<void> {
	const configuration = vscode.workspace.getConfiguration("ccims");
	await configuration.update("componentId", id, vscode.ConfigurationTarget.Workspace);
}

/**
 * Called on initialization to init all settings listeners
 */
export function initSettingsListener(): void {
	vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration("ccims.componentId")) {
			vscode.commands.executeCommand(CCIMSCommandType.API_STATUS_CHANGED);
		}
		if (e.affectsConfiguration("ccims.url")) {
			vscode.commands.executeCommand(CCIMSCommandType.API_STATUS_CHANGED);
		}
	})
}