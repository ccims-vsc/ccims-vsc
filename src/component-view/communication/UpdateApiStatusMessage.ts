import { ApiStatus } from "../../data/ApiStatus";
import { ComponentViewMessage } from "./ComponentViewMessage";
import { ComponentViewMessageType } from "./ComponentViewMessageType";

/**
 * Message to send a new ApiStatus to the webview
 */
export interface UpdateApiStatusMessage extends ComponentViewMessage {
	type: ComponentViewMessageType.UPDATE_API_STATUS,
	apiStatus: ApiStatus
}