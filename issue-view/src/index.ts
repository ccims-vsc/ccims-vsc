import "./components/vscode-search-select"

declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
	const message = event.data; // The json data that the extension sent
	
});

