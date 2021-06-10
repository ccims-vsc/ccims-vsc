import { IssueViewProviderBase } from "./IssueViewProviderBase";
import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { getCCIMSApi } from "../data/CCIMSApi";
import { IssueViewMessageType } from "./communication/IssueViewMessageType";
import { OpenIssueMessage } from "./communication/OpenIssueMessage";
import { ThemeChangedMessage } from "./communication/ThemeChangedMessage";
import { CreateIssueMessage } from "./communication/CreateIssueMessage";
import { getComponentId } from "../data/settings";
import { UpdateIssueMessage } from "./communication/UpdateIssueMessage";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";

export class IssueViewProvider extends IssueViewProviderBase {
	constructor(extensionUri: vscode.Uri, commands: CCIMSCommands) {
		super(extensionUri);

		this._initCommands(commands);
		this._initListeners();
	}

	/**
	 * Called to init the command listeners of the IssueViewProvider
	 * @param commands CCIMSCommands object which holds all commands
	 */
	private _initCommands(commands: CCIMSCommands) {
		commands.openIssueCommand.addListener(params => {
			if (params.length !== 1 || typeof params[0] !== "string") {
				throw new Error(`open issue called with wrong parameters: ${params}`)
			}
			this._openIssue(params[0]);
		});

		commands.newIssueCommand.addListener(() => {
			this._newIssue();
		});
	}

	/**
	 * Called to init the listeners which listen for messages from the webview
	 */
	private _initListeners(): void {
		this.setMessageListener(IssueViewMessageType.CREATE_ISSUE, async message => {
			const createIssueMessage = message as CreateIssueMessage;
			const api = await getCCIMSApi();
			const component = getComponentId();
			if (component != null) {
				const mutationResult = await api.createIssue({
					component: component, 
					title: createIssueMessage.title,
					body: createIssueMessage.body
				});
				vscode.commands.executeCommand(CCIMSCommandType.OPEN_ISSUE, mutationResult.createIssue?.issue?.id);
				vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
			} else {
				//TODO error handling
			}
		});

		this.setMessageListener(IssueViewMessageType.UPDATE_ISSUE, async message => {
			const updateIssueMessage = message as UpdateIssueMessage;
			const api = await getCCIMSApi();
			await api.updateIssue(updateIssueMessage.id, updateIssueMessage.title, updateIssueMessage.body);
			vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
		});
	}

	/**
	 * Called after the WebView has been resolved
	 */
	protected postResolveWebView(): void {
		this._updateTheme();
		vscode.window.onDidChangeActiveColorTheme(() => {
			this._updateTheme();
		});
	}

	/**
	 * Updates the theme of the WebView
	 */
	private _updateTheme(): void {
		const theme = vscode.window.activeColorTheme.kind;
		this.postMessage({
			type: IssueViewMessageType.THEME_CHANGED,
			theme: theme == vscode.ColorThemeKind.Dark ? "vs-dark" : theme == vscode.ColorThemeKind.Light ? "vs" : "hc-black"
		} as ThemeChangedMessage)
	}

	/**
	 * Called to open an issue
	 * @param id the id of the issue to open
	 */
	private async _openIssue(id: string): Promise<void> {
		const api = await getCCIMSApi();
		const issue = await api.getIssue(id);
		console.log(issue);
		this.postMessage({
			type: IssueViewMessageType.OPEN_ISSUE,
			issue: issue
		} as OpenIssueMessage);
	}

	/**
	 * Called to sent a message to the weview to create a new issue
	 */
	private _newIssue(): void {
		this.postMessage({
			type: IssueViewMessageType.NEW_ISSUE
		});
	}
}