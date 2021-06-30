import { ComponentViewMessageType } from "./ComponentViewMessageType";

/**
 * Interface for all messages used for communication with the webview
 */
export interface ComponentViewMessage {
	type: ComponentViewMessageType
}