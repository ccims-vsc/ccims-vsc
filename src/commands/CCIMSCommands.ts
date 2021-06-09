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
	 * Command executed to check the status of the current component
	 * expects no parameters
	 */
	public readonly checkComponentStatusCommand: CCIMSCommand;

	/**
	 * Command executed to check the status of the api
	 * expects no parameters
	 */
	public readonly checkApiStatusCommand: CCIMSCommand;

	/**
	 * Command executed when the api Url changed
	 * expects no parameters
	 */
	public readonly apiUrlChangedCommand: CCIMSCommand;

	/**
	 * Command executed when the component id changed
	 * expects no parameters
	 */
	public readonly componentIdChangedCommand: CCIMSCommand;

	/**
	 * Command executed to select a new component
	 * expects no parameters
	 */
	public readonly selectComponentCommand: CCIMSCommand;

	/**
	 * Creates all ccims extension commands
	 * Note: only one instance of this class can be created
	 * @param context the context used to create the commands
	 */
	public constructor(context: vscode.ExtensionContext) {
		this.reloadIssueListCommand = new CCIMSCommand(CCIMSCommandType.RELOAD_ISSUE_LIST, context);
		this.openIssueCommand = new CCIMSCommand(CCIMSCommandType.OPEN_ISSUE, context);
		this.checkComponentStatusCommand = new CCIMSCommand(CCIMSCommandType.CHECK_COMPONENT_STATUS, context);
		this.checkApiStatusCommand = new CCIMSCommand(CCIMSCommandType.CHECK_API_STATUS, context);
		this.apiUrlChangedCommand = new CCIMSCommand(CCIMSCommandType.API_URL_CHANGED, context);
		this.componentIdChangedCommand = new CCIMSCommand(CCIMSCommandType.COMPONENT_ID_CHANGED, context);
		this.selectComponentCommand = new CCIMSCommand(CCIMSCommandType.SELECT_COMPONENT, context);
	}
}