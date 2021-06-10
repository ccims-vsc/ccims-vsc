import * as vscode from "vscode";
import * as fs from "fs";
import { IssueViewMessage } from "./communication/IssueViewMessage";
import { IssueViewMessageType } from "./communication/IssueViewMessageType";

/**
 * Type for the MessageListener
 */
type MessageListener = (message: IssueViewMessage) => void;

export abstract class IssueViewProviderBase implements vscode.WebviewViewProvider {

	public static readonly viewType = "ccims.issueView";

	protected view?: vscode.WebviewView;

	/**
	 * map of message listeners
	 */
	private readonly _messageListeners: Map<IssueViewMessageType, MessageListener> = new Map();

	protected constructor(
		private readonly _extensionUri: vscode.Uri
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this.view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			if (!this._messageListeners.has(data.type)) {
				throw new Error(`Unknown message type: ${data.type}`);
			}
			this._messageListeners.get(data.type)!(data);
		});

		this.postResolveWebView();
	}

	/**
	 * Called after the WebView has been resolved
	 */
	protected abstract postResolveWebView(): void;

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
		if (!this.view) {
			throw new Error("view not created yet");
		}
		return this.view.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "res", resource)).toString();
	}

	/**
	 * Sends a message to the issue web view
	 * @param message the message to send to the web view
	 */
	protected postMessage(message: IssueViewMessage): void {
		this.view?.webview?.postMessage(message);
	}

	/**
	 * Adds a listener for a specific message type
	 * Warning: there can only be one listener foreach message type
	 * @param type the type for which the listener is registered
	 * @param listener the listener which is called when a message of the specified type is received
	 * @throws if a second listener is registered for the same message type
	 */
	protected setMessageListener(type: IssueViewMessageType, listener: MessageListener): void {
		if (this._messageListeners.has(type)) {
			throw new Error("There is already a listener for this type");
		}
		this._messageListeners.set(type, listener);
	}
}