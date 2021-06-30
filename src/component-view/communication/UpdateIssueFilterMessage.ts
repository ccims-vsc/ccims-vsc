import { IssueFilter } from "../../data/IssueFilter";
import { ComponentViewMessage } from "./ComponentViewMessage";
import { ComponentViewMessageType } from "./ComponentViewMessageType";

/**
 * Message to inform the webview or core extension that the issue filter changed
 */
export interface UpdateIssueFilterMessage extends ComponentViewMessage {
	type: ComponentViewMessageType.UPDATE_ISSUE_FILTER,
	filter: IssueFilter
}