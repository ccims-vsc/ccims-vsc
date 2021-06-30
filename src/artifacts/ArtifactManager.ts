import { ExtensionContext, TextEditorDecorationType } from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { listIconFiles } from "../data/IconProvider";
import { getResourceUri } from "../extension";
import * as vscode from "vscode";
import { ComponentController } from "../data/ComponentController";
import { getArtifactSchemas, getComponentId } from "../data/settings";
import { ArtifactConfig } from "./ArtifactConfig";
import { EditorArtifactManager } from "./EditorArtifactManager";
import { getCCIMSApi } from "../data/CCIMSApi";
import { Artifact } from "../generated/graphql";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";
import { setContext } from "../data/CCIMSContext";

/**
 * Class for artefacts shown in editors
 */
export class ArtifactManager {

	private readonly _artifactDecorations: Map<string, TextEditorDecorationType> = new Map();

	private readonly _editorArtifactMangers: Map<string, EditorArtifactManager> = new Map();

	private _config: ArtifactConfig | undefined;

	public get config(): ArtifactConfig | undefined {
		return this._config;
	}

	public constructor(commands: CCIMSCommands, private readonly _context: ExtensionContext, private readonly _componentController: ComponentController) {
		this._initDecorations();
		this._updateConfig();
		this._context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(editors => this._visibleEditorsChanged(editors)));
		this._context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async event => {
			await this._textDocumentChanged(event.document.uri);
		}));
		
		this._initCommands(commands);
	}

	private _initCommands(commands: CCIMSCommands): void {
		commands.reloadEditorDecoratorsCommand.addListener(() => {
			this._reload();
		});	
		commands.createArtifactCommand.addListener(params => {
			this._createArtifact(params[0] as vscode.TextEditor);
		});	
		
		commands.activateFileFilterCommand.addListener(params => {
			this._updateFileFilter(params[0] as vscode.TextEditor);
		});
	}

	private async _visibleEditorsChanged(visibleEditors: vscode.TextEditor[]): Promise<void> {
		for (const editor of visibleEditors) {
			if (!this._editorArtifactMangers.has(editor.document.uri.fsPath)) {
				this._editorArtifactMangers.set(editor.document.uri.fsPath, await EditorArtifactManager.create(editor.document.uri, this._context, this, this._componentController));
			}
			
			this._editorArtifactMangers.get(editor.document.uri.fsPath)?.updateDecorations(editor);
		}
	}

	private async _textDocumentChanged(uri: vscode.Uri): Promise<void> {
		for (const editor of vscode.window.visibleTextEditors) {
			if (editor.document.uri.fsPath === uri.fsPath) {
				await this._visibleEditorsChanged([editor]);
				break;
			}
		}
	}

	private async _reload(): Promise<void> {
		this._editorArtifactMangers.clear();
		await this._updateConfig();
	}

	private async _updateConfig(): Promise<void> {
		const url = this._componentController.repositoryURL;
		const schema = this._componentController.artifactSchema;
		if (schema != undefined && url != undefined) {
			this._config = new ArtifactConfig(schema, url);
		}
		await this._visibleEditorsChanged(vscode.window.visibleTextEditors);
	}

	/**
	 * Inits the gutter icons used for 
	 */
	private _initDecorations(): void {
		for (const iconPath of listIconFiles()) {
			const path = getResourceUri(iconPath);
			this._artifactDecorations.set(iconPath, vscode.window.createTextEditorDecorationType({
				gutterIconPath: path
			}));
		}
	}

	public getDecoratorType(iconPath: string): TextEditorDecorationType | undefined {
		return this._artifactDecorations.get(iconPath);
	}

	/**
	 * Called to create a new Artifact
	 * @param editor the editor in which the Artifact should be created
	 */
	private async _createArtifact(editor: vscode.TextEditor): Promise<void> {
		const api = await getCCIMSApi(this._context);
		const componentId = getComponentId();
		if (api != undefined && editor != undefined && this._config != undefined && componentId != undefined) {
			const result = await api.createArtifact({
				component: componentId,
				uri: this._config.pathToUrl(vscode.workspace.asRelativePath(editor.document.uri)),
				lineRangeStart: editor.selection.start.line + 1,
				lineRangeEnd: editor.selection.end.line + 1
			});
			const artifact = result.createArtifact?.artifact as Artifact | undefined;
			if (artifact != undefined) {
				await vscode.commands.executeCommand(CCIMSCommandType.ADD_ARTIFACT, artifact);
			}
		}
	}

	/**
	 * Called to filter for issues in the specified file
	 * @param editor the editor which has the file in for which to filter issues
	 */
	private async _updateFileFilter(editor: vscode.TextEditor): Promise<void> {
		if (this._config != undefined) {
			const filter = this._config.pathToUrlFilter(vscode.workspace.asRelativePath(editor.document.uri));
			await vscode.commands.executeCommand(CCIMSCommandType.UPDATE_FILE_FILTER, filter);
		}
	}

}