import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to notify that the complex icons mode changed
 */
export interface ComplexListIconsChangedMessage extends IssueViewMessage {
	type: IssueViewMessageType.COMPLEX_LIST_ICONS_CHANGED,
	complex: boolean
}