import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to search for users with the defined text
 */
export interface SearchUsersMessage extends IssueViewMessage {
	type: IssueViewMessageType.SEARCH_USERS,
	text: string
}