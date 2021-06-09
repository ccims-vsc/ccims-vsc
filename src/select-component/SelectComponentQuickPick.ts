/**
 * This is highly inspired from the git extension of VSCode
 * for license see OSS-LICENSES
 */

import { QuickPick, QuickPickItem } from "vscode";
import * as vscode from "vscode";
import { getCCIMSApi } from "../data/CCIMSApi";
import { debounce, throttle } from "../util/decorators";

/**
 * Handles the selection of the component
 */
export class SelectComponentQuickPick {
	/**
	 * the QuickPick used to select the component
	 */
	public quickpick: QuickPick<ComponentQuickPickItem>;

	/**
	 * Creates a new SelectComponentQuickPick
	 */
	public constructor() {
		this.quickpick = vscode.window.createQuickPick();
		this.quickpick.placeholder = "Search for component";
		this.quickpick.ignoreFocusOut = true;
		this.quickpick.matchOnDescription = true;
		this.quickpick.onDidChangeValue(value => {
			this._onDidChangeValue(value);
		});
		this._onDidChangeValue("");
	}

	/**
	 * Called when the user enters text
	 * @param value the new value of the input field
	 */
	@debounce(300)
	private _onDidChangeValue(value: string): void {
		this._queryComponents(value);
	}

	/**
	 * Handles the query which requests the components
	 * @param value the user entered text
	 */
	@throttle
	private async _queryComponents(value: string): Promise<void> {
		this.quickpick.busy = true;

		try {
			const api = await getCCIMSApi();
			const components = await api.searchComponents(value, 5, 50);
			if (components.length === 0) {
				this.quickpick.items = [{
					label: "No components found.",
					alwaysShow: true
				}];
			} else {
				this.quickpick.items = components.map(component => ({
					label: component.name,
					id: component.id,
					description: component.description
				}));
			}
		} catch(e) {
			//TODO better error support
			console.error(e);
		} finally {
			this.quickpick.busy = false;
		}
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

/**
 * Gets the result of a new SelectComponentQuickPick
 * @returns the id if present, otherwise null
 */
async function getSelectComponentResult(): Promise<string | null> {
	const selectQuickPick = new SelectComponentQuickPick();
	const quickpick = selectQuickPick.quickpick;

	const result = await new Promise<string | null>(resolve => {
		quickpick.onDidAccept(() => resolve(quickpick.selectedItems[0].id ?? null));
		quickpick.onDidHide(() => resolve(null));
		quickpick.show();
	});

	quickpick.hide();
	return result;
}

/**
 * Called to show a QuickPick to select a new component and update the settings based on this
 */
export async function selectComponent(): Promise<void> {
	const componentId = await getSelectComponentResult();
	if (componentId != null) {
		const configuration = vscode.workspace.getConfiguration("ccims");
		configuration.update("componentId", componentId, vscode.ConfigurationTarget.Workspace);
	}
}