import { ExtensionContext } from "vscode";
import { isApiAvailable, isApiReachable, isComponentAvailable } from "./CCIMSApi";
import { CCIMSContext, setContext } from "./CCIMSContext";
import { getApiUrl, getComponentId } from "./settings";
import { getPassword } from "keytar";
import { ApiStatus } from "./ApiStatus";
import * as vscode from "vscode";
import { CCIMSCommandType } from "../commands/CCIMSCommandType";

/**
 * Updates the status of the api
 */
export async function updateApiStatus(context: ExtensionContext): Promise<void> {
	if (!vscode.workspace.workspaceFolders) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NO_FOLDER);
	} else if (getApiUrl() == undefined) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NO_URL);
	} else if (!await isApiReachable()) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NOT_REACHABLE);
	} else if (!await isLoggedIn(context)) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NO_LOGIN);
	} else if (!await isApiAvailable(context)) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NOT_AVAILABLE);
	} else if (getComponentId() == undefined) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NO_COMPONENT);
	} else if (!await isComponentAvailable(context)) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.COMPONENT_NOT_AVAILABLE);
	} else {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NOMINAL);
	}
	vscode.commands.executeCommand(CCIMSCommandType.API_STATUS_UPDATED);
}

/**
 * Checks if the user is logged in
 */
async function isLoggedIn(context: ExtensionContext): Promise<boolean> {
	const username = context.globalState.get<string>("username");
	if (username) {
		return !!getPassword("ccims", username);
	} else {
		return false;
	}
}