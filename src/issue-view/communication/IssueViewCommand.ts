import { IssueViewCommandType } from "./IssueViewCommandType";

/**
 * Interface for all commands used for communication with the web view
 */
export interface IssueViewCommand {
	type: IssueViewCommandType
}