import { CCIMSCommand } from "./CCIMSCommand";
import * as vscode from "vscode";

/**
 * Wrapper for a VSCode text editor command
 * Allows adding multiple listeners
 */
export class CCIMSEditorCommand extends CCIMSCommand {
	/**
	 * Registers the command listener
	 * @param context context used for subscriptions
	 */
	protected registerCommand(context: vscode.ExtensionContext): void {
		context.subscriptions.push(
			vscode.commands.registerTextEditorCommand(
				this.type,
				(editor, edit, ...params) => {
					this.invokeListeners(editor, edit, ...params);
				}
			)
		);
	}
}