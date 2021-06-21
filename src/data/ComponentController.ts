import { ExtensionContext } from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { Issue } from "../generated/graphql";
import { getCCIMSApi } from "./CCIMSApi";
import { getComponentId } from "./settings";
import * as vscode from "vscode";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";

/**
 * Class which wraps the component and listens for changes
 */
export class ComponentController {
	/**
	 * List of all issues on the current component
	 */
	public issues: Issue[] = [];

	/**
	 * List of all projects the current component is on
	 */
	public projectIds: string[] = [];

	public constructor(private readonly _context: ExtensionContext, commands: CCIMSCommands) {
		commands.apiStatusChangedCommand.addListener(() => {
			this.updateData();
		});
		this.updateData();
	}

	/**
	 * Updates the known data
	 */
	private async updateData() {
		const componentId = getComponentId();
		const api = await getCCIMSApi(this._context);
		if (componentId && api != undefined) {
			const component = await api.getComponent(componentId);
			this.issues = (component.issues?.nodes ?? []) as Issue[];
			this.projectIds = component.projects?.nodes
				?.filter(project => project != undefined)
				?.map(project => project!.id!) ?? [];
			await vscode.commands.executeCommand(CCIMSCommandType.COMPONENT_DATA_CHANGED);
		}
	}
}