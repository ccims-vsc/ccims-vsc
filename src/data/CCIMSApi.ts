import * as vscode from "vscode";
import { Component, getSdk, Issue, Sdk, SearchComponentsInternalDocument, UpdateIssueBodyDocument } from "../generated/graphql";
import { GraphQLClient } from 'graphql-request';
import { getIssueIcon } from "./IconProvider";
import { getComponentId } from "./settings";

/**
 * The type of the CCIMSApi used for all requests
 */
function getSdkWrapper(sdk: Sdk) {
	return {
		...sdk,
		/**
		 * Gets a Component based on its id
		 * @param id the id of the Component
		 */
		async getComponent(id: string): Promise<Component> {
			const res = await this.getComponentInternal({ id: id });
			return res.node as Component;
		},
		/**
		 * Gets all Issues of a Component
		 * @param componentId the id of the Component
		 */
		async getIssues(componentId: string): Promise<Issue[]> {
			const component = await this.getComponent(componentId);
			return component.issues?.nodes as Issue[];
		},
		/**
		 * Gets an Issue based on its id
		 * @param id the id of the Issue to load
		 */
		async getIssue(id: string): Promise<Issue> {
			const res = await this.getIssueInternal({ id: id });
			return res.node as Issue;
		},
		/**
		 * Searches for components
		 * First seraches for components with the specified name. If not enough components are returned, 
		 * it also searches for components with a fitting description
		 * 
		 * @param text the text to search for
		 * @param minAmount if not enough components are returned for name, description is also queried
		 * @param maxAmount the max amount requested form the api
		 */
		async searchComponents(text: string, minAmount: number, maxAmount: number): Promise<Component[]> {
			const components = (await this.searchComponentsInternal({ name: text, maxAmount: maxAmount})).components?.nodes as Component[];
			if (components.length < minAmount) {
				const descriptionComponents = (await this.searchComponentsInternal({ description: text, maxAmount: maxAmount})).components?.nodes as Component[];
				components.push(...descriptionComponents);
			}
			return components;
		},
		/**
		 * Updates both the id and the body of an Issue
		 * @param id the id of the Issue to update
		 * @param title the new title for the issue
		 * @param body the new body for the issue
		 */
		async updateIssue(id: string, title: string, body: string): Promise<void> {
			await this.updateIssueTitle({ id: id, title: title });
			await this.updateIssueBody({ id: id, body: body });
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

/**
 * Checks if the api is available
 * @returns true if the api is available, otherwise false
 */
export async function isApiAvailable(): Promise<boolean> {
	const apiUrl = vscode.workspace.getConfiguration("ccims").get("apiUrl") as string;
	if (!apiUrl) {
		return false;
	}
	const api = await getCCIMSApi();
	try {
		return (await api.echo({input: "echo"})).echo === "echo";
	} catch {
		return false;
	}
}

/**
 * Checks if the api is available
 * @returns true if the api is available, otherwise false
 */
 export async function isComponentAvailable(): Promise<boolean> {
	const api = await getCCIMSApi();
	const componentId = getComponentId();
	if (!componentId) {
		return false;
	}

	try {
		return (await api.getComponentInternal({ id: componentId }))?.node != undefined;
	} catch {
		return false;
	}
}