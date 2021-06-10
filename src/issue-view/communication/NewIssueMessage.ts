import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to create a new issue in the WebView
 */
export interface NewIssueMessage extends IssueViewMessage {
	type: IssueViewMessageType.NEW_ISSUE
}