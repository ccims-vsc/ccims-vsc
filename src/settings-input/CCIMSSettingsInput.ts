import { QuickPickItem } from "vscode";
import * as vscode from "vscode";
import { getCCIMSApi, isApiAvailable, isApiReachable, isComponentAvailable, updateApiSecret } from "../data/CCIMSApi";
import { ComponentSearch } from "../data/search/ComponentSearch";
import { InputFlowAction, MultiStepInput, QuickPickParameters } from "./MultiStepInput";
import { getApiUrl, getComponentId, setApiUrl, setComponentId } from "../data/settings";
import { CCIMSCommandType } from "../commands/CCIMSCommandType";
import { getPassword, setPassword } from "keytar"

/**
 * Class to handle multi step ccims-vsc configuration
 */
export class CCIMSSettingsInput {

	public constructor(private readonly _context: vscode.ExtensionContext) {}

	/**
	 * Runs one of the update commands below
	 */
	public run(start: (input: MultiStepInput) => any): void {
		MultiStepInput.run(input => start(input));
	}

	/**
	 * Updates the api url
	 */
	public async updateApiUrl(input: MultiStepInput) {
		const urlInput = await input.showInputBox({
			title: "Select api URL",
			shouldResume: this.shouldResume,
			validate: async () => undefined,
			value: vscode.workspace.getConfiguration("ccims").get("url") ?? ""
		});
		await setApiUrl(urlInput);
		return (input: MultiStepInput) => this.maybeUpdateUsername(input);
	}

	public async maybeUpdateUsername(input: MultiStepInput) {
		if (await isApiReachable()) {
			if (await isApiAvailable(this._context)) {
				if (await this.pickPrompt(input, "You are currently logged in. Do you want to login?")) {
					return (input: MultiStepInput) => this.updateUsername(input);
				} else {
					return (input: MultiStepInput) => this.maybeUpdateComponent(input);
				}
			} else {
				return this.updateUsername(input);
			}
		} else {
			await vscode.window.showErrorMessage("The api is not reachable.");
		}
	}

	public async updateUsername(input: MultiStepInput, continueSelectComponent = true){
		const usernameInput = await input.showInputBox({
			title: "Enter username",
			shouldResume: this.shouldResume,
			validate: async () => undefined,
			value: this._context.globalState.get("username") ?? ""
		});
		await this._context.globalState.update("username", usernameInput);
		return (input: MultiStepInput) => this.updatePassword(input, usernameInput, continueSelectComponent);
	}

	public async updatePassword(input: MultiStepInput, username: string, continueSelectComponent = true) {
		let passwordInput = "";
		let correctPassword = false;
		while (!correctPassword) {
			passwordInput = await input.showInputBox({
				title: "Enter password",
				shouldResume: this.shouldResume,
				validate: async () => undefined,
				value: "",
				password: true
			});
			correctPassword = await updateApiSecret(username, passwordInput, this._context);
			if (!correctPassword) {
				vscode.window.showErrorMessage("Wrong password. Please try again");
			}
		}
		
		vscode.commands.executeCommand(CCIMSCommandType.API_STATUS_CHANGED);

		if (await this.pickPrompt(input, "Save password to system password store?")) {
			await setPassword("ccims", username, passwordInput);
		}

		if (continueSelectComponent) {
			return (input: MultiStepInput) => this.maybeUpdateComponent(input);
		}
	}

	/**
	 * If a component exists, asks the user if the component should be updated
	 */
	public async maybeUpdateComponent(input: MultiStepInput) {
		if (await isComponentAvailable(this._context)) {
			if (await this.pickPrompt(input, "A component is already set. Do you want to update the Component?")) {
				return (input: MultiStepInput) => this.updateComponent(input);
			}
		} else {
			return this.updateComponent(input);
		}
	}

	/**
	 * Updates the selected component
	 */
	public async updateComponent(input: MultiStepInput): Promise<void> {
		const search = new ComponentSearch(this._context, 10, 50);
		const api = await getCCIMSApi(this._context);
		const componentPick = await input.showQuickPick<ComponentQuickPickItem, QuickPickParameters<ComponentQuickPickItem>>({
			title: "Select component",
			placeholder: "Search for component",
			items: (await api?.searchComponents("", 5, 5))?.map(component => ({
				label: component.name,
				id: component.id,
				description: component.description
			})) ?? [],
			shouldResume: this.shouldResume,
			onDidChangeValue: (text, quickpick) => {
				search.search(text, components => {
					quickpick.items = components.map(component => ({
						label: component.name,
						id: component.id,
						description: component.description
					}));
				});
			}
		});
		const componentId = componentPick.id;
		if (componentId != null) {
			await setComponentId(componentId);
		}
	}

	/**
	 * Promps the user for a question
	 * @param prompt the question the user is asked
	 * @returns true if the user picked yes, otherwise false
	 */
	private async pickPrompt(input: MultiStepInput, prompt: string) {
		const pick = await input.showQuickPick({
			title: prompt,
			items: [{
				label: "Yes"
			},
			{
				label: "No"
			}],
			shouldResume: this.shouldResume,
			placeholder: ""
		});
		return pick.label == "Yes";
	}

	private shouldResume() {
		// Could show a notification with the option to resume.
		return new Promise<boolean>((resolve, reject) => {
			// noop
		});
	}
}

/**
 * QuickPickItem for SelectComponentQuickPick
 */
 interface ComponentQuickPickItem extends QuickPickItem {
	/**
	 * If present, the id of the issue
	 */
	id?: string | null
}