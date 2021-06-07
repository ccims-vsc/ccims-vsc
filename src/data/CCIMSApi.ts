import * as vscode from "vscode";
import { Component, getSdk, Issue, Sdk } from "../generated/graphql";
import { GraphQLClient } from 'graphql-request';

/**
 * The type of the CCIMSApi used for all requests
 */
function getSdkWrapper(sdk: Sdk) {
	return {
		...sdk,
		/**
		 * Gets a component based on its id
		 * @param id the id of the Component
		 */
		async getComponent(id: string): Promise<Component> {
			const res = await sdk.getComponentInternal({ id: id });
			return res.node as Component;
		},
		/**
		 * Gets all Issues of a Component
		 * @param componentId the id of the Component
		 */
		async getIssues(componentId: string): Promise<Issue[]> {
			const component = await this.getComponent(componentId);
			return component.issues?.nodes as Issue[];
		}
	}
}

export type CCIMSApi = ReturnType<typeof getSdkWrapper>;

/**
 * Gets a new CCIMSApi
 * @returns a new instance of the CCIMSApi
 */
export async function getCCIMSApi(): Promise<CCIMSApi> {
	return new Promise<CCIMSApi>((resolve, reject) => {
		const apiUrl = vscode.workspace.getConfiguration("ccims").get("apiUrl") as string;
		console.log(apiUrl);
		const client = new GraphQLClient(apiUrl);
		resolve(getSdkWrapper(getSdk(client)));
	});
}
