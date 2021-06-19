import { Issue, IssueCategory } from "../generated/graphql";

/**
 * Gets the simple icon for the issue
 * requires that both category and isOpen are provided
 * @param issue the issue to get the icon for
 * @returns the icon
 */
export function getIssueIcon(issue: Issue, userId: string, complex = false): string {
	console.log(complex);
	if (complex) {
		return getComplexIssueIcon(
			issue.category, 
			issue.isOpen, 
			(issue.linksToIssues?.nodes?.length ?? 0) > 0,
			(issue.linkedByIssues?.nodes?.length ?? 0) > 0,
			issue.assignees?.nodes?.some(user => user?.id === userId) ?? false
		);
	} else {
		return getSimpleIssueIcon(
			issue.category,
			issue.isOpen
		);
	}
}

/**
 * Lists all possible icons string file names
 */
export function listIconFiles(): string[] {
	const files = [];
	for (const category of [IssueCategory.Bug, IssueCategory.FeatureRequest, IssueCategory.Unclassified]) {
		for (const isOpen of [true, false]) {
			files.push(getSimpleIssueIcon(category, isOpen));
			for (const links of [true, false]) {
				for (const isLinked of [true, false]) {
					for (const star of [true, false]) {
						files.push(getComplexIssueIcon(category, isOpen, links, isLinked, star));
					}
				}
			}
		}
	}
	return files;
}

export function getComplexIssueIcon(category: IssueCategory, isOpen: boolean, links: boolean, isLinked: boolean, star: boolean): string {
	let path = "img/complex/" + getFileStart(category, isOpen);
	if (isLinked) {
		path += "_UL_incomingArrow";
	}
	if (star) {
		path += "_LL_star";
	}
	if (links) {
		path += "_UR_outgoingArrow";
	}
	return path + ".svg";
}

export function getSimpleIssueIcon(category: IssueCategory, isOpen: boolean): string {
	return "img/simple/" + getFileStart(category, isOpen) + ".svg";
}

function getFileStart(category: IssueCategory, isOpen: boolean): string {
	let start: string;
	switch(category) {
		case IssueCategory.Bug: {
			start = "bug";
			break;
		}
		case IssueCategory.FeatureRequest: {
			start = "lightbulb";
			break;
		}
		default: {
			start = "issue";
			break;
		}
	}
	if (!isOpen) {
		start += "_closed";
	}
	return start;
}