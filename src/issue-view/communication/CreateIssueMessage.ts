import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to create a new issue in the ccims
 */
export interface CreateIssueMessage extends IssueViewMessage {
	type: IssueViewMessageType.CREATE_ISSUE,
	title: string,
	body: string
}