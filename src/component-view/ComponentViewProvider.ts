import { WebviewProviderBase } from "../webview/WebviewProviderBase";
import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { ComponentController } from "../data/ComponentController";
import { ComponentViewMessage } from "./communication/ComponentViewMessage";
import { ComponentViewMessageType } from "./communication/ComponentViewMessageType";
import { UpdateComponentMessage } from "./communication/UpdateComponentMessage";
import { IssueFilter } from "../data/IssueFilter";
import { UpdateIssueFilterMessage } from "./communication/UpdateIssueFilterMessage";
import { CCIMSCommandType } from "../commands/CCIMSCommandType";
import { UpdateApiStatusMessage } from "./communication/UpdateApiStatusMessage";
import { CCIMSContext, getContext } from "../data/CCIMSContext";
import { ExecuteCommandMessage } from "./communication/ExecuteCommandMessage";

export class ComponentViewProvider extends WebviewProviderBase<ComponentViewMessage, ComponentViewMessageType> {

	/**
	 * The current filter
	 */
	private _issueFilter: IssueFilter = {
		filter: "",
		showUnclassified: true,
		showBugs: true,
		showFeatureRequests: true,
		showOpen: true,
		showClosed: true,
		showOnlySelfAssigned: false,
		showOnlyIssuesRegardingFile: null
	}

	constructor(
		extensionUri: vscode.Uri, 
		commands: CCIMSCommands, 
		private readonly _context: vscode.ExtensionContext,
		private readonly _componentController: ComponentController
	) {
		super(extensionUri, "component-view");

		this._initCommands(commands);
		this._initListeners();
	}

	/**
	 * Called to init the command listeners of the ComponentViewProvider
	 * @param commands CCIMSCommands object which holds all commands
	 */
	private _initCommands(commands: CCIMSCommands) {
		commands.componentDataChangedCommand.addListener(() => {
			this._updateComponent();
		});

		commands.toggleFilterUnclassifiedCommand.addListener(() => {
			this._issueFilter.showUnclassified = !this._issueFilter.showUnclassified;
			this._updateIssueFilter();
		});
		commands.toggleFilterBugsCommand.addListener(() => {
			this._issueFilter.showBugs = !this._issueFilter.showBugs;
			this._updateIssueFilter();
		});
		commands.toggleFilterFeatureRequestsCommand.addListener(() => {
			this._issueFilter.showFeatureRequests = !this._issueFilter.showFeatureRequests;
			this._updateIssueFilter();
		});

		commands.toggleFilterOpenCommand.addListener(() => {
			this._issueFilter.showOpen = !this._issueFilter.showOpen;
			this._updateIssueFilter();
		});
		commands.toggleFilterClosedCommand.addListener(() => {
			this._issueFilter.showClosed = !this._issueFilter.showClosed;
			this._updateIssueFilter();
		});

		commands.toggleFilterSelfAssignedCommand.addListener(() => {
			this._issueFilter.showOnlySelfAssigned = !this._issueFilter.showOnlySelfAssigned;
			this._updateIssueFilter();
		});

		commands.updateFileFilterCommand.addListener(params => {
			this._issueFilter.showOnlyIssuesRegardingFile = params[0] as string;
			this._updateIssueFilter();
		});
		commands.deactivateFileFilterCommand.addListener(() => {
			this._issueFilter.showOnlyIssuesRegardingFile = null;
			this._updateIssueFilter();
		});
		commands.clearFiltersCommand.addListener(() => {
			this._issueFilter = {
				filter: "",
				showUnclassified: true,
				showBugs: true,
				showFeatureRequests: true,
				showOpen: true,
				showClosed: true,
				showOnlySelfAssigned: false,
				showOnlyIssuesRegardingFile: null
			};
			this._updateIssueFilter();
		});

		commands.apiStatusUpdatedCommand.addListener(() => {
			this._updateApiStatus();
		});
	}

	/**
	 * Called to init the listeners which listen for messages from the webview
	 */
	private async _initListeners(): Promise<void> {
		this.setMessageListener(ComponentViewMessageType.UPDATE_ISSUE_FILTER, message => {
			const filterMessage = message as UpdateIssueFilterMessage;
			this._issueFilter = filterMessage.filter;
			vscode.commands.executeCommand(CCIMSCommandType.FILTER_CHANGED, this._issueFilter);
		});

		this.setMessageListener(ComponentViewMessageType.NOTIFY_INITIALIZED, message => {
			this._init();
		});

		this.setMessageListener(ComponentViewMessageType.EXECUTE_COMMAND, message => {
			const executeCommandMessage = message as ExecuteCommandMessage;
			vscode.commands.executeCommand(executeCommandMessage.command);
		});
	}

	/**
	 * Called after the WebView has been resolved
	 */
	protected postResolveWebView(): void {
		this._init();
	}


	/**
	 * Inits the WebView
	 * Called after start, and also after webview init
	 */
	private _init(): void {
		this._updateComponent();
		this._updateIssueFilter();
		this._updateApiStatus();
	}

	

	/**
	 * Message to inform the frontedn about a changed component id
	 */
	private _updateComponent(): void {
		this.postMessage({
			type: ComponentViewMessageType.UPDATE_COMPONENT,
			component: this._componentController.component ?? null
		} as UpdateComponentMessage);
	}

	private _updateIssueFilter(): void {
		this.postMessage({
			type: ComponentViewMessageType.UPDATE_ISSUE_FILTER,
			filter: this._issueFilter
		} as UpdateIssueFilterMessage);
		vscode.commands.executeCommand(CCIMSCommandType.FILTER_CHANGED, this._issueFilter);
	}

	private _updateApiStatus(): void {
		this.postMessage({
			type: ComponentViewMessageType.UPDATE_API_STATUS,
			apiStatus: getContext(CCIMSContext.API_STATUS)
		} as UpdateApiStatusMessage);
	}
}