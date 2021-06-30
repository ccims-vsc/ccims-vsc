/**
 * State of the filter
 */
export interface IssueFilter {
	filter: string,
	showUnclassified: boolean,
	showBugs: boolean,
	showFeatureRequests: boolean,
	showOpen: boolean,
	showClosed: boolean,
	showOnlySelfAssigned: boolean,
	showOnlyIssuesRegardingFile: string | null
}