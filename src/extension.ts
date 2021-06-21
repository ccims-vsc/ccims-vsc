import * as vscode from "vscode";
import { CCIMSCommands } from "./commands/CCIMSCommands";
import { CCIMSCommandType } from "./commands/CCIMSCommandsType";
import { isApiAvailable, isComponentAvailable, updateApiSecret } from "./data/CCIMSApi";
import { CCIMSContext, getContext, setContext } from "./data/context";
import { initSettingsListener } from "./data/settings";
import { ApiStatus, updateApiStatus } from "./data/status";
import { IssueListProvider } from "./issue-list/IssueListProvider";
import { IssueViewProvider } from "./issue-view/IssueViewProvider";
import { CCIMSSettingsInput } from "./settings-input/CCIMSSettingsInput";
import { getPassword } from "keytar";
import { ComponentController } from "./data/ComponentController";

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

	const commands = new CCIMSCommands(context);
	const componentController = new ComponentController(context, commands);
	
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			IssueViewProvider.viewType,
			new IssueViewProvider(context.extensionUri, commands, context, componentController),
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
			new IssueListProvider(commands, context, componentController)
		)
	);

	_initCommandListeners(commands, context);

	_scheduleTimer(60 * 1000, context);

	initSettingsListener();

	const username = context.globalState.get<string>("username");
	if (username) {
		getPassword("ccims", username).then((password: string | null) => {
			if (password) {
				updateApiSecret(username, password, context);
			}
		});
	}
	
	vscode.commands.executeCommand(CCIMSCommandType.API_STATUS_CHANGED);
}

/**
 * Schedules a timer, which checks for api availability if the api is not available
 * @param milliseconds the delay of the timer
 */
function _scheduleTimer(milliseconds: number, context: vscode.ExtensionContext): void {
	setInterval(() => {
		if (getContext(CCIMSContext.API_STATUS) != ApiStatus.NOMINAL) {
			updateApiStatus(context);
		}
	}, milliseconds);
}

/**
 * Called to initialize misc command listeners
 * @param commands the object which handles all ccims commands
 */
function _initCommandListeners(commands: CCIMSCommands, context: vscode.ExtensionContext): void {
	commands.checkApiStatusCommand.addListener(async () => {
		updateApiStatus(context);
	});

	commands.apiStatusChangedCommand.addListener(() => {
		vscode.commands.executeCommand(CCIMSCommandType.CHECK_API_STATUS);
	});

	commands.complexListIconsChangedCommand.addListener(() => {
		vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
	});

	commands.componentDataChangedCommand.addListener(() => {
		vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
	})

	commands.selectComponentCommand.addListener(() => {
		const input = new CCIMSSettingsInput(context);
		input.run((stepInput) => input.updateComponent(stepInput));
	});

	commands.setupExtensionCommand.addListener(() => {
		const input = new CCIMSSettingsInput(context);
		input.run((stepInput) => input.updateApiUrl(stepInput));
	});

	commands.loginCommand.addListener(() => {
		const input = new CCIMSSettingsInput(context);
		input.run((stepInput) => input.updateUsername(stepInput, false));
	});
}

/**
 * Gets a resource URI for a resource file
 * @param resourcePath the path, starting in the res director
 * @returns the URI which represents the resource
 */
export function getResourceUri(resourcePath: string): vscode.Uri {
	return vscode.Uri.joinPath(_extensionUri, "res", resourcePath);
}
