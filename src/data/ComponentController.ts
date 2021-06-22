import { ExtensionContext } from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { Issue } from "../generated/graphql";
import { getCCIMSApi } from "./CCIMSApi";
import { getArtifactSchemas, getComponentId } from "./settings";
import * as vscode from "vscode";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";
import { ArtifactSchema } from "../artifacts/ArtifactConfig";

/**
 * Class which wraps the component and listens for changes
 */
export class ComponentController {
	/**
	 * List of all issues on the current component
	 */
	public get issues(): Issue[] {
		return [...this._issueMap.values()];
	}

	private _issueMap: Map<string, Issue> = new Map();

	public repositoryURL: string | undefined;

	public artifactSchema: ArtifactSchema | undefined;

	/**
	 * List of all projects the current component is on
	 */
	public projectIds: string[] = [];

	public constructor(private readonly _context: ExtensionContext, commands: CCIMSCommands) {
		commands.apiStatusChangedCommand.addListener(() => {
			this.updateData();
		});
		commands.issueUpdatedCommand.addListener(id => {
			this.refetchIssue(id[0]);
		})
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
			const issues = (component.issues?.nodes ?? []) as Issue[];
			this._issueMap.clear();
			for (const issue of issues) {
				this._issueMap.set(issue.id!, issue);
			}
			this.repositoryURL = component.repositoryURL as string | undefined;
			console.log(this.repositoryURL);
			this.projectIds = component.projects?.nodes
				?.filter(project => project != undefined)
				?.map(project => project!.id!) ?? [];

			if (this.repositoryURL != undefined) {
				for (const schema of getArtifactSchemas() ?? []) {
					if (new RegExp(schema.matchesRepositoryUrl).test(this.repositoryURL)) {
						this.artifactSchema = schema;
					}
				}
			}
			
			await vscode.commands.executeCommand(CCIMSCommandType.COMPONENT_DATA_CHANGED);
		}
	}

	private async refetchIssue(id: string): Promise<void> {
		const api = await getCCIMSApi(this._context);
		if (api != undefined) {
			const issue = await api.refetchIssue(id);
			this._issueMap.set(issue.id!, issue);

			await vscode.commands.executeCommand(CCIMSCommandType.COMPONENT_DATA_CHANGED);
		}
	}

	/**
	 * Gets an issue by id
	 * @param id the id of the issue to get
	 */
	public issueById(id: string): Issue | undefined {
		return this._issueMap.get(id);
	}
}