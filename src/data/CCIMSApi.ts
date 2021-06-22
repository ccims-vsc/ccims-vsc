import * as vscode from "vscode";
import { Artifact, Component, getSdk, Issue, Label, Sdk } from "../generated/graphql";
import { GraphQLClient } from 'graphql-request';
import { getApiUrl, getComponentId, getLoginUrl, getPublicApiUrl, isComplexListIcons } from "./settings";
import axios from "axios";
import { CCIMSCommandType } from "../commands/CCIMSCommandsType";

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
			if (isComplexListIcons()) {
				return (await this.getComponentInternalComplex({ id: id })).node as Component;
			} else {
				return (await this.getComponentInternalSimple({ id: id })).node as Component;
			}
		},
		/**
		 * Gets a Component based on its id
		 * @param id the id of the Component
		 */
		async refetchIssue(id: string): Promise<Issue> {
			if (isComplexListIcons()) {
				return (await this.refetchIssueComplex({ id: id })).node as Issue;
			} else {
				return (await this.refetchIssueSimple({ id: id })).node as Issue;
			}
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
		async getIssue(id: string): Promise<Issue | undefined> {
			if (isComplexListIcons()) {
				return (await this.getIssueInternalComplex({ id: id })).node as Issue | undefined;
			} else {
				return (await this.getIssueInternalSimple({ id: id })).node as Issue | undefined;
			}
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
			const components: Map<string, Component> = new Map();
			const nameComponents = (await this.searchComponentsInternal({ name: text, maxAmount: maxAmount})).components?.nodes as Component[];
			for (const component of nameComponents) {
				components.set(component.id!, component);
			}

			if (components.size < minAmount) {
				const descriptionComponents = (await this.searchComponentsInternal({ description: text, maxAmount: maxAmount - components.size})).components?.nodes as Component[];
				for (const component of descriptionComponents) {
					components.set(component.id!, component);
				}
			}
			return [...components.values()];
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
		 * @param projects the projects on which to search
		 * @param components the components on which to search
		 * @param text the text to search for
		 * @param minAmount the min amount of Issues to find
		 * @param maxAmount the max amount of Issues to find
		 * @returns the found Issues
		 */
		async searchIssues(projects: string[], components: string[], text: string, minAmount: number, maxAmount: number): Promise<Issue[]> {
			const issues: Map<string, Issue> = new Map();
			let nodes;
			let searchFunction;
			if (projects.length > 0) {
				nodes = projects
				searchFunction = isComplexListIcons() ? this.searchIssuesInternalComplexProject : this.searchIssuesInternalSimpleProject;
			} else {
				nodes = components
				searchFunction = isComplexListIcons() ? this.searchIssuesInternalComplexComponent : this.searchIssuesInternalSimpleComponent;
			}
			
			for (const node of nodes) {
				if (issues.size >= minAmount) {
					break;
				}
				const nameIssues = (await searchFunction({id: node, title: text, maxAmount: maxAmount - issues.size}))?.node as Component | undefined;
				const nameResults = nameIssues?.issues?.nodes as Issue[] | undefined;
				if (nameResults != undefined) {
					for (const issue of nameResults) {
						issues.set(issue.id!, issue);
					}
				}
				const descriptionIssues = (await searchFunction({id: node, body: text, maxAmount: maxAmount - issues.size}))?.node as Component | undefined;
				const descriptionResults = descriptionIssues?.issues?.nodes as Issue[] | undefined;
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
		},
		/**
		 * Searches for Artifacts with the defined name (uri)
		 * It searches per component until enough were found
		 * @param components the components on which to search
		 * @param text the text to search for
		 * @param minAmount the min amount of Artifacts to find
		 * @param maxAmount the max amount of Artifacts to find
		 * @returns the found Artifacts
		 */
		async searchArtifacts(components: string[], text: string, minAmount: number, maxAmount: number): Promise<Artifact[]> {
			const artifacts: Map<string, Artifact> = new Map();
			for (const component of components) {
				if (artifacts.size >= minAmount) {
					break;
				}
				const nameComponent = (await this.searchArtifactsInternal({id: component, name: text, maxAmount: maxAmount - artifacts.size}))?.node as Component | undefined;
				const nameResults = nameComponent?.artifacts?.nodes as Artifact[] | undefined;
				if (nameResults != undefined) {
					for (const artifact of nameResults) {
						artifacts.set(artifact.id!, artifact);
					}
				}
			}
			return [...artifacts.values()];
		},
		/**
		 * Searches for artifacts on a Component
		 * @param component the component on which to search for artifacts
		 * @param filter the filter for documents
		 */
		async artifactsForFile(component: string, artifactFilter: string): Promise<Artifact[]> {
			const artifactsResult = await this.artifactsForFileInternal({ component: component, artifactFilter: artifactFilter });
			return (artifactsResult.node as Component).artifacts?.nodes as Artifact[];
		}
	}
}

export type CCIMSApi = ReturnType<typeof getSdkWrapper>;

/**
 * Gets a new CCIMSApi
 * @returns a new instance of the CCIMSApi
 */
export async function getCCIMSApi(context: vscode.ExtensionContext): Promise<CCIMSApi | undefined> {
	const apiUrl = getApiUrl();
	if (apiUrl != undefined) {
		try {
			const client = new GraphQLClient(apiUrl, {
				headers: {
					authorization: `bearer ${await context.secrets.get("ccims-bearer")}`
				}
			});
			return getSdkWrapper(getSdk(client));
		} catch {
			return undefined
		}
		
	} else {
		return undefined;
	}
}

/**
 * Checks if the api is reachable
 * does not check if login information exists
 * @returns true if the api is reachable, otherwise false
 */
export async function isApiReachable(): Promise<boolean> {
	const publicApiUrl = getPublicApiUrl();
	if (publicApiUrl != undefined) {
		try {
			const result = await axios.post(publicApiUrl, {
				query: "query { echo(input: \"available\") }"
			});

			return result.data.data.echo === "available"
		} catch {
			return false;
		}
	} else {
		return false;
	}
}

/**
 * Checks if the api is available
 * @returns true if the api is available, otherwise false
 */
export async function isApiAvailable(context: vscode.ExtensionContext): Promise<boolean> {
	const apiUrl = getApiUrl();
	if (!apiUrl) {
		return false;
	}
	const api = await getCCIMSApi(context);
	try {
		return (await api?.echo({input: "echo"}))?.echo === "echo";
	} catch(e) {
		return false;
	}
}

/**
 * Checks if the api is available
 * @returns true if the api is available, otherwise false
 */
export async function isComponentAvailable(context: vscode.ExtensionContext): Promise<boolean> {
	const api = await getCCIMSApi(context);
	const componentId = getComponentId();
	if (!componentId) {
		return false;
	}

	try {
		return (await api?.getComponentInternalSimple({ id: componentId }))?.node != undefined;
	} catch {
		return false;
	}
}

export async function updateApiSecret(username: string, password: string, context: vscode.ExtensionContext): Promise<boolean> {
	const loginUrl = getLoginUrl();
	console.log(loginUrl);
	if (loginUrl != undefined) {
		try {
			const response = await axios.post(loginUrl, {
				username: username,
				password: password
			});

			await context.secrets.store("ccims-bearer", response.data.token);
			await vscode.commands.executeCommand(CCIMSCommandType.API_STATUS_CHANGED);
			const api = await getCCIMSApi(context);
			await context.globalState.update("userId", (await api!.currentUser()).currentUser?.id);
			await vscode.commands.executeCommand(CCIMSCommandType.USER_ID_CHANGED);
			return true;
		} catch {
			return false;
		}
	} else {
		return false;
	}
}