/**
 * Enum of all CCIMS Commands
 */
export enum CCIMSCommandType {
	RELOAD_ISSUE_LIST = "ccims.reloadIssueList",
	OPEN_ISSUE = "ccims.openIssue",
	CHECK_API_STATUS = "ccims.checkApiStatus",
	CHECK_COMPONENT_STATUS = "ccims.checkComponentStatus",
	API_URL_CHANGED = "ccims.apiUrlChanged",
	COMPONENT_ID_CHANGED = "ccims.componentIdChanged",
	SELECT_COMPONENT = "ccims.selectComponent",
	NEW_ISSUE = "ccims.newIssue"
}