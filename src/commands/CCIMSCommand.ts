import { CCIMSCommandType } from "./CCIMSCommandType";
import * as vscode from "vscode";

/**
 * Wrapper for a VSCode command
 * Allows adding multiple listeners
 */
export class CCIMSCommand {

	/**
	 * list of listeners which are executed
	 */
	private _listeners: ((params: any[]) => void)[] = [];

	/**
	 * Creates a new command
	 * automatically registers the command
	 * @param type the type of the command
	 * @param context the context in which the command is executed, used to create command
	 */
	public constructor(public readonly type: CCIMSCommandType, context: vscode.ExtensionContext) {
		this.registerCommand(context);
	}

	/**
	 * Registers the command listener
	 * @param context context used for subscriptions
	 */
	protected registerCommand(context: vscode.ExtensionContext): void {
		context.subscriptions.push(
			vscode.commands.registerCommand(
				this.type,
				(...params: any[]) => {
					this.invokeListeners(...params);
				}
			)
		);
	}

	/**
	 * Invokes all command listeners
	 * @param params the params the listener is invoked with
	 */
	protected invokeListeners(...params: any[]): void {
		this._listeners.forEach(listener => {
			listener(params);
		});
	}

	/**
	 * Adds a listener which is called each time the command is invoked
	 * @param listener the listener which is executed when the command is activated
	 */
	public addListener(listener: (params: any[]) => void): void {
		this._listeners.push(listener);
	}
}