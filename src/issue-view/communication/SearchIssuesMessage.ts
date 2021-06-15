import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to search for issues with the defined text
 */
export interface SearchIssuesMessage extends IssueViewMessage {
	type: IssueViewMessageType.SEARCH_ISSUES,
	text: string
}