import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { getCCIMSApi } from "../data/CCIMSApi";
import { getIssueIcon } from "../data/IconProvider";
import { Issue } from "../generated/graphql";
import { getComponentId } from "../settings";

/**
 * View used to display a tree of all Issues
 */
export class IssueListProvider implements vscode.TreeDataProvider<Issue> {

	public constructor(commands: CCIMSCommands) {

	}

	public onDidChangeTreeData?: vscode.Event<void | Issue | null | undefined> | undefined;

	public getTreeItem(element: Issue): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return {
			id: element.id!,
			label: element.title,
			iconPath: getIssueIcon(element)
		}
	}

	public async getChildren(element?: Issue): Promise<undefined | Issue[]> {
		if (element != undefined) {
			//TODO: maybe add artifacts etc. here
			return new Promise(resolve => resolve(undefined));
		} else {
			const api = await getCCIMSApi();
			const componentId = await getComponentId();
			if (componentId != null) {
				return await api.getIssues(componentId);
			} else {
				return undefined;
			}
		}
	}

}