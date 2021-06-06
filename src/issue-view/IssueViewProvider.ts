import * as vscode from "vscode";
import * as fs from "fs";

export class IssueViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = "ccims.issueView";

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
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

	public getResourceUri(resource: string): string {
		if (!this._view) {
			throw new Error("view not created yet");
		}
		return this._view.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "res", resource)).toString();
	}
}