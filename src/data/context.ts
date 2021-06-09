import * as vscode from "vscode";

/**
 * Internal dictionary for context variables
 */
const contextVariables: Map<CCIMSContext, any> = new Map();

/**
 * Called to set a context value, which can for example be used in a when clause
 * Used for viewWelcome
 * @param context the context to set
 * @param value the value to set
 */
export function setContext(context: CCIMSContext, value: any): void {
	vscode.commands.executeCommand("setContext", context, value);
	contextVariables.set(context, value);
}
 
/**
 * Gets a context variable
 * Note: this only tracks variable set via setContext function
 * @param context 
 */
export function getContext(context: CCIMSContext): any {
	return contextVariables.get(context);
}

/**
 * Enum for all common ccims contexts
 */
export enum CCIMSContext {
	API_AVAILABLE = "ccims.apiAvailable",
	COMPONENT_AVAILABLE = "ccims.componentAvailable",
	INITIALIZED = "ccims.initialized"
}