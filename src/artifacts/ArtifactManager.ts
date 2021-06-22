import { ExtensionContext, TextEditorDecorationType } from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { listIconFiles } from "../data/IconProvider";
import { getResourceUri } from "../extension";
import * as vscode from "vscode";
import { ComponentController } from "../data/ComponentController";
import { getArtifactSchemas } from "../data/settings";
import { ArtifactConfig } from "./ArtifactConfig";
import { EditorArtifactManager } from "./EditorArtifactManager";

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
		}))
		
		commands.reloadEditorDecoratorsCommand.addListener(() => {
			this._reload();
		})
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

}