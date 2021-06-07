import { Issue } from "../../generated/graphql";
import { IssueViewCommand } from "./IssueViewCommand";
import { IssueViewCommandType } from "./IssueViewCommandType";

/**
 * Command to open an issue
 */
export interface OpenIssueCommand extends IssueViewCommand {
	type: IssueViewCommandType.OPEN_ISSUE,
	issue: Issue
}