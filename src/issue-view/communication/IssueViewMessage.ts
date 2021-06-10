import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Interface for all messages used for communication with the web view
 */
export interface IssueViewMessage {
	type: IssueViewMessageType
}