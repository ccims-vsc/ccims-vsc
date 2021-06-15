import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to search for labels with the defined text
 */
export interface SearchLabelsMessage extends IssueViewMessage {
	type: IssueViewMessageType.SEARCH_LABELS,
	text: string
}