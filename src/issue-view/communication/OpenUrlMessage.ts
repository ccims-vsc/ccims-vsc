import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to notify the extension that a url should be opened
 */
export interface OpenUrlMessage extends IssueViewMessage {
	type: IssueViewMessageType.OPEN_URL,
	url: string
}