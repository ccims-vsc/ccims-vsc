import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to search for artifacts with the defined text
 */
export interface SearchArtifactsMessage extends IssueViewMessage {
	type: IssueViewMessageType.SEARCH_ARTIFACTS,
	text: string
}