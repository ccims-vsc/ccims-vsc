import { IssueCategory } from "../../generated/graphql";

/**
 * Interface that represents several edits on an issue
 * Can also be used to create a new Issue
 */
export interface IssueDiff {
	title?: string,
	body?: string,
	category?: IssueCategory,
	isOpen?: boolean
	addedLabels?: string[],
	removedLabels?: string[],
	addedAssignees?: string[],
	removedAssignees?: string[],
	addedArtifacts?: string[],
	removedArtifacts?: string[],
	addedLinkedIssues?: string[],
	removedLinkedIssues?: string[]
}