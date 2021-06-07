import { Issue } from "../generated/graphql";
import { Uri } from "vscode";
import { getResourceUri } from "../extension";

/**
 * Gets the simple icon for the issue
 * requires that both category and isOpen are provided
 * @param issue the issue to get the icon for
 * @returns the icon
 */
export function getIssueIcon(issue: Issue): Uri {
	//TODO real implementation
	return getResourceUri("img/logo.svg");
}