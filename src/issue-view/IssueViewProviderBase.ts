import * as vscode from "vscode";
import * as fs from "fs";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { IssueViewCommand } from "./communication/IssueViewCommand";
import { IssueViewCommandType } from "./communication/IssueViewCommandType";

/**
 * Type for the CommandListener
 */
type CommandListener = (command: IssueViewCommand) => void;

export class IssueViewProviderBase implements vscode.WebviewViewProvider {

	public static readonly viewType = "ccims.issueView";

	private _view?: vscode.WebviewView;

	/**
	 * map of command listeners
	 */
	private readonly _commandListeners: Map<IssueViewCommandType, CommandListener> = new Map();

	protected constructor(
		private readonly _extensionUri: vscode.Uri
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			if (!this._commandListeners.has(data.type)) {
				throw new Error(`Unknown command type: ${data.type}`);
			}
			this._commandListeners.get(data.type)!(data);
		})

	}

	/**
	 * Loads and transforms the HTML for the Issue web view
	 * Replaes all vsc-escape(file) occurances with the appropriate res/file URI
	 * @param webview the webview for which the generated HTML will be used
	 * @returns the transformed HTML
	 */
	private _getHtmlForWebview(webview: vscode.Webview) {
		const htmlPath: vscode.Uri = vscode.Uri.joinPath(this._extensionUri, "issue-view", "dist", "index.html");
		let html = fs.readFileSync(htmlPath.fsPath, 'utf8');
		//replace js file path
		html = html.replaceAll("/js/app.js", webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "issue-view", "dist", "js", "app.js")).toString());
		return html;
	}

	/**
	 * Gets the relative uri for the resource file
	 * @param resource the path of the resource, relative to the resource folder
	 * @returns A string which represents the resource
	 */
	protected getResourceUri(resource: string): string {
		if (!this._view) {
			throw new Error("view not created yet");
		}
		return this._view.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "res", resource)).toString();
	}

	/**
	 * Sends a command to the issue web view
	 * @param command the command to send to the web view
	 */
	protected postCommand(command: IssueViewCommand): void {
		this._view?.webview?.postMessage(command);
	}

	/**
	 * Adds a listener for a specific command type
	 * Warning: there can only be one listener foreach command type
	 * @param type the type for which the listener is registered
	 * @param listener the listener which is called when a command of the specified type is received
	 * @throws if a second listener is registered for the same command type
	 */
	protected addCommandListener(type: IssueViewCommandType, listener: CommandListener): void {
		if (this._commandListeners.has(type)) {
			throw new Error("There is already a listener for this type");
		}
		this._commandListeners.set(type, listener);
	}
}