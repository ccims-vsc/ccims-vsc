import { Label } from "../../generated/graphql";
import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to inform the webview about the found Labels
 */
export interface FoundLabelsMessage extends IssueViewMessage {
	type: IssueViewMessageType.FOUND_LABELS,
	labels: Label[]
}