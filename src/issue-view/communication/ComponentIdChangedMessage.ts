import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to notify that the componentId changed
 */
export interface ComponentIdChangedMessage extends IssueViewMessage {
	type: IssueViewMessageType.COMPONENT_ID_CHANGED,
	componentId?: string
}