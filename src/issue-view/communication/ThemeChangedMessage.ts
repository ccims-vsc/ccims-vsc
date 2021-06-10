import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to open an issue
 */
export interface ThemeChangedMessage extends IssueViewMessage {
	type: IssueViewMessageType.THEME_CHANGED,
	theme: "vs" | "vs-dark" | "hc-black"
}