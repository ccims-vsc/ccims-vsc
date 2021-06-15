import * as vscode from "vscode";
import { CCIMSCommands } from "./commands/CCIMSCommands";
import { CCIMSCommandType } from "./commands/CCIMSCommandsType";
import { isApiAvailable, isComponentAvailable } from "./data/CCIMSApi";
import { CCIMSContext, getContext, setContext } from "./data/context";
import { initSettingsListener } from "./data/settings";
import { IssueListProvider } from "./issue-list/IssueListProvider";
import { IssueViewProvider } from "./issue-view/IssueViewProvider";
import { selectComponent } from "./select-component/SelectComponentQuickPick";

/**
 * cached extension uri
 */
let _extensionUri: vscode.Uri

/**
 * Called when the extension is activated
 * @param context the context when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
	_extensionUri = context.extensionUri;
	//set default value, so that welcome message is only displayed if connect actively failed
	setContext(CCIMSContext.API_AVAILABLE, true);
	setContext(CCIMSContext.COMPONENT_AVAILABLE, true);

	const commands = new CCIMSCommands(context);
	
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			IssueViewProvider.viewType,
			new IssueViewProvider(context.extensionUri, commands),
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);
	
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"ccims.issueList",
			new IssueListProvider(commands)
		)
	);

	_initCommandListeners(commands);

	_scheduleTimer(60 * 1000);

	initSettingsListener();

	vscode.commands.executeCommand(CCIMSCommandType.COMPONENT_ID_CHANGED);
	vscode.commands.executeCommand(CCIMSCommandType.API_URL_CHANGED);

	setContext(CCIMSContext.INITIALIZED, true);
}

/**
 * Schedules a timer, which checks for api availability if the api is not available
 * @param milliseconds the delay of the timer
 */
function _scheduleTimer(milliseconds: number): void {
	setInterval(() => {
		if (!getContext(CCIMSContext.API_AVAILABLE)) {
			vscode.commands.executeCommand(CCIMSCommandType.CHECK_API_STATUS);
		}
	}, milliseconds);
}

/**
 * Called to initialize misc command listeners
 * @param commands the object which handles all ccims commands
 */
function _initCommandListeners(commands: CCIMSCommands): void {
	commands.checkApiStatusCommand.addListener(async () => {
		const apiAvailable = await isApiAvailable();
		const oldApiAvailable = getContext(CCIMSContext.API_AVAILABLE);
		setContext(CCIMSContext.API_AVAILABLE, apiAvailable);

		if (apiAvailable != oldApiAvailable) {
			vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
			if (apiAvailable) {
				vscode.commands.executeCommand(CCIMSCommandType.CHECK_COMPONENT_STATUS);
			}
		}
	});

	commands.checkComponentStatusCommand.addListener(async () => {
		const componentAvailable = await isComponentAvailable();
		const oldComponentAvailable = getContext(CCIMSContext.COMPONENT_AVAILABLE);
		setContext(CCIMSContext.COMPONENT_AVAILABLE, componentAvailable);

		if (oldComponentAvailable != componentAvailable) {
			vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
		}
	});

	commands.apiUrlChangedCommand.addListener(() => {
		vscode.commands.executeCommand(CCIMSCommandType.CHECK_API_STATUS);
		vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
	});

	commands.componentIdChangedCommand.addListener(() => {
		vscode.commands.executeCommand(CCIMSCommandType.CHECK_COMPONENT_STATUS);
		vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
	});

	commands.selectComponentCommand.addListener(() => {
		selectComponent();
	})
}

/**
 * Gets a resource URI for a resource file
 * @param resourcePath the path, starting in the res director
 * @returns the URI which represents the resource
 */
export function getResourceUri(resourcePath: string): vscode.Uri {
	return vscode.Uri.joinPath(_extensionUri, "res", resourcePath);
}
