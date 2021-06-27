import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";
import { getCCIMSApi } from "../data/CCIMSApi";
import { getIssueIcon } from "../data/IconProvider";
import { Issue } from "../generated/graphql";
import { getComponentId, isComplexListIcons } from "../data/settings";
import { getResourceUri } from "../extension";
import { ComponentController } from "../data/ComponentController";
import { CCIMSContext, getContext, setContext } from "../data/context";

/**
 * View used to display a tree of all Issues
 */
export class IssueListProvider implements vscode.TreeDataProvider<Issue> {

	private _onDidChangeTreeData: vscode.EventEmitter<Issue | undefined | null | void> 
		= new vscode.EventEmitter<Issue | undefined | null | void>();

	/**
	 * Creates a new IssueListProvider
	 * @param commands commands used to listen for refresh command
	 */
	public constructor(private readonly _commands: CCIMSCommands, private readonly _context: vscode.ExtensionContext, private readonly _componentController: ComponentController) {
		this._commands.reloadIssueListCommand.addListener(() => this.refresh());
		this._initFilterCommands();
	}

	private _initFilterCommands(): void {
		this._commands.activateFilterSelfAssignedCommand.addListener(() => {
			setContext(CCIMSContext.FILTER_SELF_ASSIGNED, true);
			this.refresh();
		});
		this._commands.deactivateFilterSelfAssignedCommand.addListener(() => {
			setContext(CCIMSContext.FILTER_SELF_ASSIGNED, false);
			this.refresh();
		});

		this._commands.setOpenFilterToOpenCommand.addListener(() => {
			setContext(CCIMSContext.FILTER_OPEN, 1);
			this.refresh();
		});
		this._commands.setOpenFilterToClosedCommand.addListener(() => {
			setContext(CCIMSContext.FILTER_OPEN, 2);
			this.refresh();
		});
		this._commands.deactivateOpenFilterCommand.addListener(() => {
			setContext(CCIMSContext.FILTER_OPEN, 0);
			this.refresh();
		});

		this._commands.updateFileFilterCommand.addListener(params => {
			setContext(CCIMSContext.FILTER_FILE, params[0]);
			this.refresh();
		});
		this._commands.deactivateFileFilterCommand.addListener(() => {
			setContext(CCIMSContext.FILTER_FILE, null);
			this.refresh();
		});
	}

	public onDidChangeTreeData?: vscode.Event<void | Issue | null | undefined> | undefined = this._onDidChangeTreeData.event;

	/**
	 * Can be called to refresh the list
	 */
	private refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public getTreeItem(element: Issue): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return {
			id: element.id!,
			label: element.title,
			iconPath: getResourceUri(getIssueIcon(element, this._context.globalState.get<string>("userId") ?? "", isComplexListIcons())),
			command: {
				command: CCIMSCommandType.OPEN_ISSUE,
				title: "Open issue",
				arguments: [element.id]
			}
		};
	}

	public async getChildren(element?: Issue): Promise<undefined | Issue[]> {
		if (element != undefined) {
			//TODO: maybe add artifacts etc. here
			return new Promise(resolve => resolve(undefined));
		} else {
			const api = await getCCIMSApi(this._context);
			const componentId =  getComponentId();
			if (componentId != null) {
				let issues = this._componentController.issues;
				const userId = this._context.globalState.get<string>("userId");
				if (getContext(CCIMSContext.FILTER_SELF_ASSIGNED) && userId) {
					issues = issues.filter(issue => issue.assignees?.nodes?.some(user => user?.id === userId) ?? false);
				}
				if (getContext(CCIMSContext.FILTER_OPEN)) {
					if (getContext(CCIMSContext.FILTER_OPEN) === 1) {
						issues = issues.filter(issue => issue.isOpen);
					} else {
						issues = issues.filter(issue => !issue.isOpen);
					}
				}
				if (getContext(CCIMSContext.FILTER_FILE)) {
					const filter = RegExp(getContext(CCIMSContext.FILTER_FILE));

					issues = issues.filter(issue => (issue.artifacts?.nodes ?? []).some(artifact => {
						const artifactUri = artifact?.uri;
						if (artifactUri != undefined) {
							return filter.test(artifactUri);
						} else {
							return false;
						}
					}));
				}
				return issues;
			} else {
				return undefined;
			}
		}
	}

}
