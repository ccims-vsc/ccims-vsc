import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message which sends the frontend the icon table
 */
export interface IconTableMessage extends IssueViewMessage {
	type: IssueViewMessageType.ICON_TABLE,
	icons: { [key: string]: string; }
}