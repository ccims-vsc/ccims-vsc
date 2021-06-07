import * as vscode from "vscode";
import { CCIMSCommand } from "./CCIMSCommand";
import { CCIMSCommandType } from "./CCIMSCommandsType";

/**
 * Container with all commands known to the ccims extension
 * Can be used to add listeners to specific commands
 */
export class CCIMSCommands {
	/**
	 * Command executed to reload the issue list
	 * expects no parameters
	 */
	public readonly reloadIssueListCommand: CCIMSCommand;

	/**
	 * Command executed to open a specific Issue
	 * expects one parameter: the id of the Issue to open
	 */
	public readonly openIssueCommand: CCIMSCommand;

	/**
	 * Creates all ccims extension commands
	 * Note: only one instance of this class can be created
	 * @param context the context used to create the commands
	 */
	public constructor(context: vscode.ExtensionContext) {
		this.reloadIssueListCommand = new CCIMSCommand(CCIMSCommandType.RELOAD_ISSUE_LIST, context);
		this.openIssueCommand = new CCIMSCommand(CCIMSCommandType.OPEN_ISSUE, context);
	}
}