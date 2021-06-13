import { IssueViewProviderBase } from "./IssueViewProviderBase";
import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { CCIMSApi, getCCIMSApi } from "../data/CCIMSApi";
import { IssueViewMessageType } from "./communication/IssueViewMessageType";
import { OpenIssueMessage } from "./communication/OpenIssueMessage";
import { ThemeChangedMessage } from "./communication/ThemeChangedMessage";
import { CreateIssueMessage } from "./communication/CreateIssueMessage";
import { getComponentId } from "../data/settings";
import { UpdateIssueMessage } from "./communication/UpdateIssueMessage";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";
import { IssueDiff } from "./communication/IssueDiff";

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
			this._createIssue(createIssueMessage.diff);
		});

		this.setMessageListener(IssueViewMessageType.UPDATE_ISSUE, async message => {
			const updateIssueMessage = message as UpdateIssueMessage;
			this._updateIssue(updateIssueMessage.diff, updateIssueMessage.id);
		});
	}

	/**
	 * Creates a new Issue based on the provided IssueDiff
	 * @param diff the IssueDiff which defines the new image
	 */
	private async _createIssue(diff: IssueDiff): Promise<void> {
		const api = await getCCIMSApi();
		const component = getComponentId();

		if (component != null) {
			const result = await api.createIssue({
				component: component,
				title: diff.title ?? "",
				body: diff.body ?? "",
				category: diff.category,
				labels: diff.addedLabels,
				assignees: diff.addedAssignees,
				artifacts: diff.addedArtifacts
			});
			const id = result.createIssue?.issue?.id;
			if (id != undefined) {
				vscode.commands.executeCommand(CCIMSCommandType.OPEN_ISSUE, result.createIssue?.issue?.id);
				vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
			} else {
				//TODO error handling
			}
		} else {
			//TODO error handling
		}
	}

	/**
	 * Updates an existing Issue based on the provided IssueDiff
	 * @param diff the IssueDiff which defines how to update the Issue
	 * @param id the id of the Issue to update
	 */
	private async _updateIssue(diff: IssueDiff, id: string): Promise<void> {
		const api = await getCCIMSApi();
		if (diff.title != undefined) {
			await api.updateIssueTitle({
				id: id,
				title: diff.title
			});
		}

		if (diff.body != undefined) {
			await api.updateIssueBody({
				id: id,
				body: diff.body
			});
		}

		if (diff.category != undefined) {
			await api.updateIssueCategory({
				id: id,
				category: diff.category
			});
		}

		if (diff.isOpen != undefined) {
			if (diff.isOpen) {
				await api.reopenIssue({ id: id });
			} else {
				await api.closeIssue({ id: id });
			}
		}

		vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
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