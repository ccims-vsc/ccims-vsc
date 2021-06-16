import * as vscode from "vscode";
import { Component, getSdk, Issue, Label, Sdk } from "../generated/graphql";
import { GraphQLClient } from 'graphql-request';
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
				const descriptionComponents = (await this.searchComponentsInternal({ description: text, maxAmount: maxAmount - components.length})).components?.nodes as Component[];
				components.push(...descriptionComponents);
			}
			return components;
		},
		/**
		 * Searches for labels with the defined name of description on all specified components
		 * It searches per component until enough were found
		 * First, a component is queried by name, then by description
		 * @param components the components on which to search
		 * @param text the text to search for
		 * @param minAmount the min amount of labels to find
		 * @param maxAmount the max amount of labels to find
		 * @returns the found labels
		 */
		async searchLabels(components: string[], text: string, minAmount: number, maxAmount: number): Promise<Label[]> {
			const labels: Map<string, Label> = new Map();
			for (const component of components) {
				if (labels.size >= minAmount) {
					break;
				}
				const nameComponent = (await this.searchLabelsInternal({id: component, name: text, maxAmount: maxAmount - labels.size}))?.node as Component | undefined;
				const nameResults = nameComponent?.labels?.nodes as Label[] | undefined;
				if (nameResults != undefined) {
					for (const label of nameResults) {
						labels.set(label.id!, label);
					}
				}
				const descriptionComponent = (await this.searchLabelsInternal({id: component, description: text, maxAmount: maxAmount - labels.size}))?.node as Component | undefined;
				const descriptionResults = descriptionComponent?.labels?.nodes as Label[] | undefined;
				if (descriptionResults != undefined) {
					for (const label of descriptionResults) {
						labels.set(label.id!, label);
					}
				}
				if (labels.size >= minAmount) {
					break;
				}
			}
			return [...labels.values()];
		},
		/**
		 * Searches for isses with the defined title of body on all specified components
		 * It searches per component until enough were found
		 * First, a component is queried by title, then by body
		 * @param components the components on which to search
		 * @param text the text to search for
		 * @param minAmount the min amount of Issues to find
		 * @param maxAmount the max amount of Issues to find
		 * @returns the found Issues
		 */
		 async searchIssues(components: string[], text: string, minAmount: number, maxAmount: number): Promise<Issue[]> {
			const issues: Map<string, Issue> = new Map();
			for (const component of components) {
				if (issues.size >= minAmount) {
					break;
				}
				const nameComponent = (await this.searchIssuesInternal({id: component, title: text, maxAmount: maxAmount - issues.size}))?.node as Component | undefined;
				const nameResults = nameComponent?.issues?.nodes as Issue[] | undefined;
				if (nameResults != undefined) {
					for (const issue of nameResults) {
						issues.set(issue.id!, issue);
					}
				}
				const descriptionComponent = (await this.searchIssuesInternal({id: component, body: text, maxAmount: maxAmount - issues.size}))?.node as Component | undefined;
				const descriptionResults = descriptionComponent?.issues?.nodes as Issue[] | undefined;
				if (descriptionResults != undefined) {
					for (const issue of descriptionResults) {
						issues.set(issue.id!, issue);
					}
				}
				if (issues.size >= minAmount) {
					break;
				}
			}
			return [...issues.values()];
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