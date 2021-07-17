import { CCIMSCommandType } from "../../commands/CCIMSCommandType";
import { ComponentViewMessage } from "./ComponentViewMessage";
import { ComponentViewMessageType } from "./ComponentViewMessageType";

/**
 * Message to execute a command
 */
export interface ExecuteCommandMessage extends ComponentViewMessage {
	type: ComponentViewMessageType.EXECUTE_COMMAND,
	command: CCIMSCommandType | string
}