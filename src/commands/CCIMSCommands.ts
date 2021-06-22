import * as vscode from "vscode";
import { CCIMSCommand } from "./CCIMSCommand";
import { CCIMSCommandType } from "./CCIMSCommandsType";
import { CCIMSEditorCommand } from "./CCIMSEditorCommand";

/**
 * Container with all commands known to the ccims extension
 * Can be used to add listeners to specific commands
 */
export class CCIMSCommands {
	public readonly apiStatusChangedCommand: CCIMSCommand;

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
	 * Command executed to check the status of the api
	 * expects no parameters
	 */
	public readonly checkApiStatusCommand: CCIMSCommand;

	/**
	 * Command executed to select a new component
	 * expects no parameters
	 */
	public readonly selectComponentCommand: CCIMSCommand;

	/**
	 * Command executed to create a new issue
	 * expects no parameters
	 */
	public readonly newIssueCommand: CCIMSCommand;

	/**
	 * Command executed to setup the extension
	 * expects no parameters
	 */
	public readonly setupExtensionCommand: CCIMSCommand;

	/**
	 * Command executed to login
	 * expects no parameters
	 */
	public readonly loginCommand: CCIMSCommand;

	/**
	 * Command called when the list icons mode changes
	 * expects no parameters
	 */
	public readonly complexListIconsChangedCommand: CCIMSCommand;

	/**
	 * Command executed when the user id changed
	 * expects no parameters
	 */
	public readonly userIdChangedCommand: CCIMSCommand;

	/**
	 * Command executed when the component data changed
	 * expects no parameters
	 */
	public readonly componentDataChangedCommand: CCIMSCommand;

	/**
	 * Command executed to reload the text editor decorators
	 * expects no parameters
	 */
	public readonly reloadEditorDecoratorsCommand: CCIMSCommand;

	/**
	 * Command executed to inform that an issue was updated
	 * expects one parameter: the id of the issue which was updated
	 */
	public readonly issueUpdatedCommand: CCIMSCommand;

	/**
	 * Command called to add an artifact to the current open issue
	 * expects one parameter: the current artifact
	 */
	public readonly addArtifactCommand: CCIMSCommand;

	/**
	 * Command executed to create an artifact
	 * expects one parameter: TextEditor on which the command was executed
	 */
	public readonly createArtifactCommand: CCIMSCommand;

	/**
	 * Creates all ccims extension commands
	 * Note: only one instance of this class can be created
	 * @param context the context used to create the commands
	 */
	public constructor(context: vscode.ExtensionContext) {
		this.reloadIssueListCommand = new CCIMSCommand(CCIMSCommandType.RELOAD_ISSUE_LIST, context);
		this.openIssueCommand = new CCIMSCommand(CCIMSCommandType.OPEN_ISSUE, context);
		this.checkApiStatusCommand = new CCIMSCommand(CCIMSCommandType.CHECK_API_STATUS, context);
		this.selectComponentCommand = new CCIMSCommand(CCIMSCommandType.SELECT_COMPONENT, context);
		this.newIssueCommand = new CCIMSCommand(CCIMSCommandType.NEW_ISSUE, context);
		this.setupExtensionCommand = new CCIMSCommand(CCIMSCommandType.SETUP_EXTENSION, context);
		this.loginCommand = new CCIMSCommand(CCIMSCommandType.LOGIN, context);
		this.apiStatusChangedCommand = new CCIMSCommand(CCIMSCommandType.API_STATUS_CHANGED, context);
		this.complexListIconsChangedCommand = new CCIMSCommand(CCIMSCommandType.COMPLEX_LIST_ICONS_CHANGED, context);
		this.userIdChangedCommand = new CCIMSCommand(CCIMSCommandType.USER_ID_CHANGED, context);
		this.componentDataChangedCommand = new CCIMSCommand(CCIMSCommandType.COMPONENT_DATA_CHANGED, context);
		this.reloadEditorDecoratorsCommand = new CCIMSCommand(CCIMSCommandType.RELOAD_EDITOR_DECORATORS, context);
		this.issueUpdatedCommand = new CCIMSCommand(CCIMSCommandType.ISSUE_UPDATED, context);
		this.addArtifactCommand = new CCIMSCommand(CCIMSCommandType.ADD_ARTIFACT, context);

		this.createArtifactCommand = new CCIMSEditorCommand(CCIMSCommandType.CREATE_ARTIFACT, context);
	}
}