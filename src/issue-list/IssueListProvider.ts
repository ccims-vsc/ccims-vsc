import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";
import { getCCIMSApi } from "../data/CCIMSApi";
import { getIssueIcon } from "../data/IconProvider";
import { Issue, IssueCategory } from "../generated/graphql";
import { getComponentId, isComplexListIcons } from "../data/settings";
import { getResourceUri } from "../extension";
import { ComponentController } from "../data/ComponentController";
import { CCIMSContext, getContext, setContext } from "../data/CCIMSContext";
import { IssueFilter } from "../data/IssueFilter";

/**
 * View used to display a tree of all Issues
 */
export class IssueListProvider implements vscode.TreeDataProvider<Issue> {

	private _issueFilter?: IssueFilter;

	private _onDidChangeTreeData: vscode.EventEmitter<Issue | undefined | null | void> 
		= new vscode.EventEmitter<Issue | undefined | null | void>();

	/**
	 * Creates a new IssueListProvider
	 * @param commands commands used to listen for refresh command
	 */
	public constructor(private readonly _commands: CCIMSCommands, private readonly _context: vscode.ExtensionContext, private readonly _componentController: ComponentController) {
		this._commands.reloadIssueListCommand.addListener(() => this.refresh());
		
		this._commands.filterChangedCommand.addListener(params => {
			this._issueFilter = params[0];
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
				const filter = this._issueFilter;

				if (filter != undefined) {
					if (filter.showOnlySelfAssigned && userId) {
						issues = issues.filter(issue => issue.assignees?.nodes?.some(user => user?.id === userId) ?? false);
					}
					if (!filter.showOpen) {
						issues = issues.filter(issue => !issue.isOpen);
					}
					if (!filter.showClosed) {
						issues = issues.filter(issue => issue.isOpen);
					}
					if (filter.showOnlyIssuesRegardingFile) {
						const filterRegex = RegExp(filter.showOnlyIssuesRegardingFile);
						issues = issues.filter(issue => (issue.artifacts?.nodes ?? []).some(artifact => {
							const artifactUri = artifact?.uri;
							if (artifactUri != undefined) {
								return filterRegex.test(artifactUri);
							} else {
								return false;
							}
						}));
					}
					if (!filter.showUnclassified) {
						issues = issues.filter(issue => issue.category != IssueCategory.Unclassified);
					}
					if (!filter.showBugs) {
						issues = issues.filter(issue => issue.category != IssueCategory.Bug);
					}
					if (!filter.showFeatureRequests) {
						issues = issues.filter(issue => issue.category != IssueCategory.FeatureRequest);
					}
					if (filter.filter) {
						const filterRegex = RegExp(filter.filter, "i");
						issues = issues.filter(issue => filterRegex.test(issue.title) || filterRegex.test(issue.body));
					}
				}
				return issues;
			} else {
				return undefined;
			}
		}
	}

}
