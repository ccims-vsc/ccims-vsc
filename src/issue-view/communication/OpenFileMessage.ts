import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to notify the extension that a file should be opened
 */
export interface OpenFileMessage extends IssueViewMessage {
	type: IssueViewMessageType.OPEN_FILE,
	file: string,
	lineRangeStart: number,
	lineRangeEnd: number
}