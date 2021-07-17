import * as vscode from "vscode";
import { CCIMSCommand } from "./CCIMSCommand";
import { CCIMSCommandType } from "./CCIMSCommandType";
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
	 * Command to toggle the unclassified issues filter
	 * expects no parameters
	 */
	public readonly toggleFilterUnclassifiedCommand: CCIMSCommand;

	/**
	 * Command to toggle the bugs filter
	 * expects no parametes
	 */
	public readonly toggleFilterBugsCommand: CCIMSCommand;

	/**
	 * Command to toggle the feature requests filter
	 * expects no parameters
	 */
	public readonly toggleFilterFeatureRequestsCommand: CCIMSCommand;

	/**
	 * Command to toggle the open issues filter
	 * expects no parametes
	 */
	public readonly toggleFilterOpenCommand: CCIMSCommand;

	/**
	 * Command to toggle the closed issues filter
	 * expects no parameters
	 */
	public readonly toggleFilterClosedCommand: CCIMSCommand;

	/**
	 * Command to toggle the only self-assigned filter
	 * expects no parameters
	 */
	public readonly toggleFilterSelfAssignedCommand: CCIMSCommand;

	/**
	 * Command to reset all issue filters
	 * expects no parameters
	 */
	public readonly clearFiltersCommand: CCIMSCommand;

	/**
	 * Command executed when the issue filter changes
	 * expects one parameter: the new filter
	 */
	public readonly filterChangedCommand: CCIMSCommand;

	/**
	 * Command executed to only show issues regarding a specific file
	 * expects one parameter: TextEditor on which the command was executed
	 */
	public readonly activateFileFilterCommand: CCIMSCommand;

	/**
	 * Command executed to remove the file filter
	 * expects no parameters 
	 */
	public readonly deactivateFileFilterCommand: CCIMSCommand;

	/**
	 * Command executed to update the file filter
	 * expects one parameter: the new filter string
	 */
	public readonly updateFileFilterCommand: CCIMSCommand;

	/**
	 * Command executed when the ApiStatus context is changed
	 * expects no parameter
	 */
	public readonly apiStatusUpdatedCommand: CCIMSCommand;

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
		this.deactivateFileFilterCommand = new CCIMSCommand(CCIMSCommandType.DEACTIVATE_FILE_FILTER, context);
		this.updateFileFilterCommand = new CCIMSCommand(CCIMSCommandType.UPDATE_FILE_FILTER, context);
		this.toggleFilterUnclassifiedCommand = new CCIMSCommand(CCIMSCommandType.TOGGLE_FILTER_UNCLASSIFIED, context);
		this.toggleFilterBugsCommand = new CCIMSCommand(CCIMSCommandType.TOGGLE_FILTER_BUGS, context);
		this.toggleFilterFeatureRequestsCommand = new CCIMSCommand(CCIMSCommandType.TOGGLE_FILTER_FEATURE_REQUESTS, context);
		this.toggleFilterOpenCommand = new CCIMSCommand(CCIMSCommandType.TOGGLE_FILTER_OPEN, context);
		this.toggleFilterClosedCommand = new CCIMSCommand(CCIMSCommandType.TOGGLE_FILTER_CLOSED, context);
		this.toggleFilterSelfAssignedCommand = new CCIMSCommand(CCIMSCommandType.TOGGLE_FILTER_SELF_ASSIGNED, context);
		this.filterChangedCommand = new CCIMSCommand(CCIMSCommandType.FILTER_CHANGED, context);
		this.apiStatusUpdatedCommand = new CCIMSCommand(CCIMSCommandType.API_STATUS_UPDATED, context);
		this.clearFiltersCommand = new CCIMSCommand(CCIMSCommandType.CLEAR_FILTERS, context);

		this.createArtifactCommand = new CCIMSEditorCommand(CCIMSCommandType.CREATE_ARTIFACT, context);
		this.activateFileFilterCommand = new CCIMSEditorCommand(CCIMSCommandType.ACTIVATE_FILE_FILTER, context);
	}
}