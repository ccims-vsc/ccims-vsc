/**
 * List of messages used for communication with the issue web view
 */
export enum IssueViewMessageType {
	OPEN_ISSUE = "openIssue",
	THEME_CHANGED = "themeChanged",
	NEW_ISSUE = "newIssue",
	CREATE_ISSUE = "createIssue",
	UPDATE_ISSUE = "updateIssue",
	SEARCH_USERS = "searchUsers",
	FOUND_USERS = "foundUsers",
	SEARCH_LABELS = "searchLabels",
	FOUND_LABELS = "foundLabels",
	SEARCH_ARTIFACTS = "searchArtifacts",
	FOUND_ARTIFACTS = "foundArtifacts",
	SEARCH_ISSUES = "searchIssues",
	FOUND_ISSUES = "foundIssues",
	USER_ID_CHANGED = "userIdChanged",
	ICON_TABLE = "iconTable",
	COMPLEX_LIST_ICONS_CHANGED = "complexListIconsChanged",
	COMPONENT_ID_CHANGED = "componentIdChanged"
}