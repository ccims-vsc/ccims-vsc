import { ComponentViewMessage } from "./ComponentViewMessage";
import { ComponentViewMessageType } from "./ComponentViewMessageType";


/**
 * Message which sends the frontend the icon table
 */
export interface IconTableMessage extends ComponentViewMessage {
	type: ComponentViewMessageType.ICON_TABLE,
	icons: { [key: string]: string; }
}