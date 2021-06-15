import { User } from "../../generated/graphql";
import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to inform the webview about the found Users
 */
export interface FoundUsersMessage extends IssueViewMessage {
	type: IssueViewMessageType.FOUND_USERS,
	users: User[]
}