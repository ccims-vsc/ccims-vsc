/**
 * Enum of all CCIMS Commands
 */
export enum CCIMSCommandType {
	RELOAD_ISSUE_LIST = "ccims.reloadIssueList",
	OPEN_ISSUE = "ccims.openIssue",
	CHECK_API_STATUS = "ccims.checkApiStatus",
	API_STATUS_CHANGED = "ccims.apiStatusChanged",
	COMPONENT_DATA_CHANGED = "ccims.componentStatusChanged",
	SELECT_COMPONENT = "ccims.selectComponent",
	NEW_ISSUE = "ccims.newIssue",
	SETUP_EXTENSION = "ccims.setupExtension",
	LOGIN = "ccims.login",
	COMPLEX_LIST_ICONS_CHANGED = "ccims.complexListIconsChanged",
	USER_ID_CHANGED = "ccims.userIdChanged",
	RELOAD_EDITOR_DECORATORS = "ccims.reloadEditorDecorators",
	ISSUE_UPDATED = "ccims.issueUpdated",
	CREATE_ARTIFACT = "ccims.createArtifact",
	ADD_ARTIFACT = "ccims.addArtifact",
	ACTIVATE_FILE_FILTER = "ccims.activateFileFilter",
	DEACTIVATE_FILE_FILTER = "ccims.deactivateFileFilter",
	UPDATE_FILE_FILTER = "ccims.updateFileFilter",
	TOGGLE_FILTER_UNCLASSIFIED = "ccims.toggleFilterUnclassified",
	TOGGLE_FILTER_BUGS = "ccims.toggleFilterBugs",
	TOGGLE_FILTER_FEATURE_REQUESTS = "ccims.toggleFilterFeatureRequests",
	TOGGLE_FILTER_OPEN = "ccims.toggleFilterOpen",
	TOGGLE_FILTER_CLOSED = "ccims.toggleFilterClosed",
	TOGGLE_FILTER_SELF_ASSIGNED = "ccims.toggleFilterSelfAssigned",
	FILTER_CHANGED = "ccims.filterChanged"
}