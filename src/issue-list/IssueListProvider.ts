import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";
import { getCCIMSApi } from "../data/CCIMSApi";
import { getIssueIcon } from "../data/IconProvider";
import { Issue } from "../generated/graphql";
import { getComponentId, isComplexListIcons } from "../data/settings";
import { getResourceUri } from "../extension";

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
	public constructor(private readonly _commands: CCIMSCommands, private readonly _context: vscode.ExtensionContext) {
		this._commands.reloadIssueListCommand.addListener(() => this.refresh());
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
		}
	}

	public async getChildren(element?: Issue): Promise<undefined | Issue[]> {
		if (element != undefined) {
			//TODO: maybe add artifacts etc. here
			return new Promise(resolve => resolve(undefined));
		} else {
			const api = await getCCIMSApi(this._context);
			const componentId =  getComponentId();
			if (componentId != null) {
				return await api?.getIssues(componentId);
			} else {
				return undefined;
			}
		}
	}

}
