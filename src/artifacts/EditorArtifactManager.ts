import { ExtensionContext, TextEditor, Uri } from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { ArtifactManager } from "./ArtifactManager";
import * as vscode from "vscode";
import { Artifact, Issue } from "../generated/graphql";
import { getCCIMSApi } from "../data/CCIMSApi";
import { getComponentId, isComplexListIcons } from "../data/settings";
import { getIssueIcon, listIconFiles } from "../data/IconProvider";
import { ComponentController } from "../data/ComponentController";

/**
 * Class which manages the artifacts for an editor
 */
export class EditorArtifactManager {

	private _artifacts: Map<number, Artifact[]> = new Map();

	private readonly _relativePath: string;

	private readonly _decorationsTypes: string[];

	private constructor(private readonly uri: Uri, private readonly _context: ExtensionContext, private readonly _artifactManager: ArtifactManager, private readonly _componentController: ComponentController) {
		this._relativePath = vscode.workspace.asRelativePath(uri);
		this._decorationsTypes = listIconFiles();
	}

	public static async create(uri: Uri,  _context: ExtensionContext, _artifactManager: ArtifactManager, _componentController: ComponentController): Promise<EditorArtifactManager> {
		const result = new EditorArtifactManager(uri, _context, _artifactManager, _componentController);
		await result._init();
		return result;
	}

	private async _init(): Promise<void> {
		const api = await getCCIMSApi(this._context);
		const componentId = getComponentId();
		const config = this._artifactManager.config
		if (api != undefined && componentId != undefined && config != undefined) {
			const artifacts = await api.artifactsForFile(componentId, config.pathToUrlFilter(this._relativePath));
			for (const artifact of artifacts) {
				const lineNumber = (artifact.lineRangeStart ?? artifact.lineRangeEnd ?? 1) - 1;
				if (!this._artifacts.has(lineNumber)) {
					this._artifacts.set(lineNumber, []);
				}
				this._artifacts.get(lineNumber)!.push(artifact);
			}
		}
	}

	public updateDecorations(editor: TextEditor): void {
		const decoratorTypes: Map<string, [Artifact, Issue][]> = new Map();
		for (const decorationType of this._decorationsTypes) {
			decoratorTypes.set(decorationType, []);
		}

		for (const [line, artifacts] of this._artifacts) {
			if (artifacts.length > 0 && artifacts) {
				const artifact = artifacts[0];
				if (artifact?.issues?.nodes != undefined) {
					const openIssues = artifact.issues.nodes.filter(issue => issue?.isOpen)
					if (openIssues.length > 0) {
						const issue = this._componentController.issueById(openIssues[0]?.id!)!;
						const iconPath = getIssueIcon(issue, this._context.globalState.get<string>("userId") ?? "", isComplexListIcons());
						decoratorTypes.get(iconPath)?.push([artifact, issue]);
					}
				}
			}
		}

		for (const entry of decoratorTypes) {
			const decoratorType = this._artifactManager.getDecoratorType(entry[0]);
			if (decoratorType != undefined) {
				editor.setDecorations(decoratorType, entry[1].map(artifactIssue => {
					const artifact = artifactIssue[0];
					const start = (artifact.lineRangeStart ?? artifact.lineRangeEnd ?? 1) - 1;
					if (editor.document.lineCount >= start) {
						return new vscode.Range(start, 0, start, 0);
					} else {
						return undefined;
					}
				}).filter(range => range != undefined) as vscode.Range[]);
			}	
		}
	}
}