import { Issue } from "../../generated/graphql";
import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to open an issue
 */
export interface OpenIssueMessage extends IssueViewMessage {
	type: IssueViewMessageType.OPEN_ISSUE,
	issue: Issue
}