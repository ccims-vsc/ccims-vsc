/**
 * List of messages used for communication with the component webview
 */
export enum ComponentViewMessageType {
	UPDATE_ISSUE_FILTER = "updateIssueFilter",
	UPDATE_COMPONENT = "updateComponent",
	NOTIFY_INITIALIZED = "notifyInitialized",
	EXECUTE_COMMAND = "executeCommand",
	UPDATE_API_STATUS = "updateApiStatus"
}