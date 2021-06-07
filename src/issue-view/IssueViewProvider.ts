import { IssueViewProviderBase } from "./IssueViewProviderBase";
import * as vscode from "vscode";
import { CCIMSCommands } from "../commands/CCIMSCommands";
import { getCCIMSApi } from "../data/CCIMSApi";
import { IssueViewCommandType } from "./communication/IssueViewCommandType";
import { OpenIssueCommand } from "./communication/OpenIssueCommand";

export class IssueViewProvider extends IssueViewProviderBase {
	constructor(extensionUri: vscode.Uri, commands: CCIMSCommands) {
		super(extensionUri);

		commands.openIssueCommand.addListener(params => {
			if (params.length !== 1 || typeof params[0] !== "string") {
				throw new Error(`open issue called with wrong parameters: ${params}`)
			}
			this._openIssue(params[0]);
		});
	}

	/**
	 * Called to open an issue
	 * @param id the id of the issue to open
	 */
	private async _openIssue(id: string): Promise<void> {
		const api = await getCCIMSApi();
		const issue = await api.getIssue(id);
		this.postCommand({
			type: IssueViewCommandType.OPEN_ISSUE,
			issue: issue
		} as OpenIssueCommand);
	}
}