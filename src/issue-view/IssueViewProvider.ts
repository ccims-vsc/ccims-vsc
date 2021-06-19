import { IssueViewProviderBase } from "./IssueViewProviderBase";
import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { IssueViewMessageType } from "./communication/IssueViewMessageType";
import { OpenIssueMessage } from "./communication/OpenIssueMessage";
import { ThemeChangedMessage } from "./communication/ThemeChangedMessage";
import { CreateIssueMessage } from "./communication/CreateIssueMessage";
import { getComponentId, isComplexListIcons } from "../data/settings";
import { UpdateIssueMessage } from "./communication/UpdateIssueMessage";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";
import { IssueDiff } from "./communication/IssueDiff";
import { Issue } from "../generated/graphql";
import { SearchLabelsMessage } from "./communication/SearchLabelsMessage";
import { LabelSearch } from "../data/search/LabelSearch";
import { FoundLabelsMessage } from "./communication/FoundLabelsMessage";
import { IssueSearch } from "../data/search/IssueSearch";
import { SearchIssuesMessage } from "./communication/SearchIssuesMessage";
import { FoundIssuesMessage } from "./communication/FoundIssuesMessage";
import { UserSearch } from "../data/search/UserSearch";
import { FoundUsersMessage } from "./communication/FoundUsersMessage";
import { SearchUsersMessage } from "./communication/SearchUsersMessage";
import { ArtifactSearch } from "../data/search/ArtifactSearch";
import { SearchArtifactsMessage } from "./communication/SearchArtifactsMessage";
import { FoundArtifactsMessage } from "./communication/FoundArtifactsMessage";
import { CCIMSApi, getCCIMSApi } from "../data/CCIMSApi";
import { UserIdChangedMessage } from "./communication/UserIdChangedMessage";
import { listIconFiles } from "../data/IconProvider";
import { IconTableMessage } from "./communication/IconTableMessage";
import { ComplexListIconsChangedMessage } from "./communication/ComplexListIconsChangedMessage";

const MIN_SEARCH_AMOUNT = 10;
const MAX_SEARCH_AMOUNT = 100;

export class IssueViewProvider extends IssueViewProviderBase {
	/**
	 * The current issue, undefined if none selected yet or new in creation
	 */
	private _issue?: Issue;

	/**
	 * Getter for the component list of the current issue
	 * if no issue is set, the current component is returned
	 */
	private get _components(): string[] | null {
		const issueComponents = this._issue?.components?.nodes?.map(component => component?.id).filter(id => id != undefined) as string[] | undefined;
		if (issueComponents != undefined && issueComponents.length > 0) {
			return issueComponents;
		} else {
			const currentComponent = getComponentId();
			if (currentComponent != null) {
				return [currentComponent];
			} else {
				return null;
			}
		}
	}

	constructor(extensionUri: vscode.Uri, commands: CCIMSCommands, private readonly _context: vscode.ExtensionContext) {
		super(extensionUri);

		this._initCommands(commands);
		this._initListeners();
		commands.reloadIssueListCommand.addListener(() => {
			if (this._issue != undefined) {
				this._openIssue(this._issue.id ?? "");
			}
		});
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

		commands.userIdChangedCommand.addListener(() => {
			this._updateUserId();
		});

		commands.complexListIconsChangedCommand.addListener(() => {
			this._updateComplexListItems();
		})
	}

	/**
	 * Called to init the listeners which listen for messages from the webview
	 */
	private async _initListeners(): Promise<void> {
		this.setMessageListener(IssueViewMessageType.CREATE_ISSUE, async message => {
			const createIssueMessage = message as CreateIssueMessage;
			this._createIssue(createIssueMessage.diff);
		});

		this.setMessageListener(IssueViewMessageType.UPDATE_ISSUE, async message => {
			const updateIssueMessage = message as UpdateIssueMessage;
			this._updateIssue(updateIssueMessage.diff, updateIssueMessage.id);
		});

		await this._initSearchListeners();
	}

	/**
	 * Called to init search related listeners
	 */
	private async _initSearchListeners(): Promise<void> {
		const labelSearch = new LabelSearch(this._context, MIN_SEARCH_AMOUNT, MAX_SEARCH_AMOUNT);
		this.setMessageListener(IssueViewMessageType.SEARCH_LABELS, async message => {
			const searchLabelsMessage = message as SearchLabelsMessage;
			const components = this._components;
			if (components != null) {
				labelSearch.search({ components: components, text: searchLabelsMessage.text},
					labels => {
						this.postMessage({
							type: IssueViewMessageType.FOUND_LABELS,
							labels: labels
						} as FoundLabelsMessage);
					}
				);
			}
		});

		const issueSearch = new IssueSearch(this._context, MIN_SEARCH_AMOUNT, MAX_SEARCH_AMOUNT);
		this.setMessageListener(IssueViewMessageType.SEARCH_ISSUES, async message => {
			const searchIssuesMessage = message as SearchIssuesMessage;
			const components = this._components;
			if (components != null) {
				issueSearch.search({ components: components, text: searchIssuesMessage.text},
					issues => {
						this.postMessage({
							type: IssueViewMessageType.FOUND_ISSUES,
							issues: issues
						} as FoundIssuesMessage);
					}
				);
			}
		});

		const userSearch = new UserSearch(this._context, MIN_SEARCH_AMOUNT, MAX_SEARCH_AMOUNT);
		this.setMessageListener(IssueViewMessageType.SEARCH_USERS, async message => {
			const searchUsersMessage = message as SearchUsersMessage;
			const components = this._components;
			if (components != null) {
				userSearch.search(searchUsersMessage.text,
					users => {
						this.postMessage({
							type: IssueViewMessageType.FOUND_USERS,
							users: users
						} as FoundUsersMessage);
					}
				);
			}
		});

		const artifactSearch = new ArtifactSearch(this._context, MIN_SEARCH_AMOUNT, MAX_SEARCH_AMOUNT);
		this.setMessageListener(IssueViewMessageType.SEARCH_ARTIFACTS, async message => {
			const searchArtifactsMessage = message as SearchArtifactsMessage;
			const components = this._components;
			if (components != null) {
				artifactSearch.search({ components: components, text: searchArtifactsMessage.text},
					artifacts => {
						this.postMessage({
							type: IssueViewMessageType.FOUND_ARTIFACTS,
							artifacts: artifacts
						} as FoundArtifactsMessage);
					}
				);
			}
		});
	}

	/**
	 * Creates a new Issue based on the provided IssueDiff
	 * @param diff the IssueDiff which defines the new image
	 */
	private async _createIssue(diff: IssueDiff): Promise<void> {
		const component = getComponentId();
		const api = await getCCIMSApi(this._context);
		if (component != undefined && api != undefined) {
			const result = await api?.createIssue({
				component: component,
				title: diff.title ?? "",
				body: diff.body ?? "",
				category: diff.category,
				labels: diff.addedLabels,
				assignees: diff.addedAssignees,
				artifacts: diff.addedArtifacts,
			});
			const id = result?.createIssue?.issue?.id;

			if (id != undefined) {
				if (diff.addedLinkedIssues != undefined) {
					for (const linkedIssue of diff.addedLinkedIssues) {
						await api?.linkIssue({ issue: id, linkedIssue: linkedIssue });
					}
				}
				if (diff.removedLinkedIssues != undefined) {
					for (const linkedIssue of diff.removedLinkedIssues) {
						await api?.unlinkIssue({ issue: id, linkedIssue: linkedIssue });
					}
				}

				vscode.commands.executeCommand(CCIMSCommandType.OPEN_ISSUE, result?.createIssue?.issue?.id);
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
		const api = await getCCIMSApi(this._context);
		if (api != undefined) {
			if (diff.title != undefined) {
				await api?.updateIssueTitle({
					id: id,
					title: diff.title
				});
			}
	
			if (diff.body != undefined) {
				await api?.updateIssueBody({
					id: id,
					body: diff.body
				});
			}
	
			if (diff.category != undefined) {
				await api?.updateIssueCategory({
					id: id,
					category: diff.category
				});
			}
	
			if (diff.isOpen != undefined) {
				if (diff.isOpen) {
					await api?.reopenIssue({ id: id });
				} else {
					await api?.closeIssue({ id: id });
				}
			}
	
			if (diff.addedLabels != undefined) {
				for (const label of diff.addedLabels) {
					await api?.addLabelToIssue({ issue: id, label: label });
				}
			}
			if (diff.removedLabels != undefined) {
				for (const label of diff.removedLabels) {
					await api?.removeLabelFromIssue({ issue: id, label: label });
				}
			}
	
			if (diff.addedLinkedIssues != undefined) {
				for (const linkedIssue of diff.addedLinkedIssues) {
					await api?.linkIssue({ issue: id, linkedIssue: linkedIssue });
				}
			}
			if (diff.removedLinkedIssues != undefined) {
				for (const linkedIssue of diff.removedLinkedIssues) {
					await api?.unlinkIssue({ issue: id, linkedIssue: linkedIssue });
				}
			}
	
			if (diff.addedAssignees != undefined) {
				for (const assignee of diff.addedAssignees) {
					await api?.addAssignee({ issue: id, assignee: assignee });
				}
			}
			if (diff.removedAssignees != undefined) {
				for (const assignee of diff.removedAssignees) {
					await api?.removeAssignee({ issue: id, assignee: assignee });
				}
			}
	
			vscode.commands.executeCommand(CCIMSCommandType.RELOAD_ISSUE_LIST);
		}
	}

	/**
	 * Called after the WebView has been resolved
	 */
	protected postResolveWebView(): void {
		this._updateTheme();
		this._updateUserId();
		this._updateIconTable();
		this._updateComplexListItems();
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
	 * Message to inform the frontend about a changed user id
	 */
	private _updateUserId(): void {
		this.postMessage({
			type: IssueViewMessageType.USER_ID_CHANGED,
			id: this._context.globalState.get("userId")
		} as UserIdChangedMessage);
	}

	/**
	 * Sends an updated icon table to the frontend
	 */
	private _updateIconTable(): void {
		const icons = listIconFiles();
		const iconTable: { [key: string]: string; } = {};
		for (const icon of icons) {
			iconTable[icon] = this.getResourceUri(icon).toString()
		}
		this.postMessage({
			type: IssueViewMessageType.ICON_TABLE,
			icons: iconTable
		} as IconTableMessage);
	}

	/**
	 * Message to inform the frontend about changed complex list icons
	 */
	private _updateComplexListItems(): void {
		this.postMessage({
			type: IssueViewMessageType.COMPLEX_LIST_ICONS_CHANGED,
			complex: isComplexListIcons()
		} as ComplexListIconsChangedMessage);
	}

	/**
	 * Called to open an issue
	 * @param id the id of the issue to open
	 */
	private async _openIssue(id: string): Promise<void> {
		const api = await getCCIMSApi(this._context);
		if (api != undefined) {
			this._issue = await api?.getIssue(id);
			this.postMessage({
				type: IssueViewMessageType.OPEN_ISSUE,
				issue: this._issue
			} as OpenIssueMessage);
		}
	}

	/**
	 * Called to sent a message to the weview to create a new issue
	 */
	private _newIssue(): void {
		this._issue = undefined;
		this.postMessage({
			type: IssueViewMessageType.NEW_ISSUE
		});
	}
}