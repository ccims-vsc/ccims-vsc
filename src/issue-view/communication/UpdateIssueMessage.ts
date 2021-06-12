import { IssueDiff } from "./IssueDiff";
import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to update the title and body of an already existing issue
 */
export interface UpdateIssueMessage extends IssueViewMessage {
	type: IssueViewMessageType.UPDATE_ISSUE,
	id: string,
	diff: IssueDiff
}