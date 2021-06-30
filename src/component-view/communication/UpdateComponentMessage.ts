import { Component } from "../../generated/graphql";
import { ComponentViewMessage } from "./ComponentViewMessage";
import { ComponentViewMessageType } from "./ComponentViewMessageType";

/**
 * Message to send a new component to the webview
 */
export interface UpdateComponentMessage extends ComponentViewMessage {
	type: ComponentViewMessageType.UPDATE_COMPONENT,
	component: Component | null
}