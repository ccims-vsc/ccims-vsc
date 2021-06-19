import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to notify that the user id changed
 */
export interface UserIdChangedMessage extends IssueViewMessage {
	type: IssueViewMessageType.USER_ID_CHANGED,
	id: string | undefined
}