import { Component } from "../../generated/graphql";
import { getCCIMSApi } from "../CCIMSApi";
import { ApiSearch } from "./ApiSearch";

/**
 * Class to query the api for users on specific components that match a specific text
 */
export class ComponentSearch extends ApiSearch<string, Component> {

	/**
	 * Queries the api for Users
	 * @param value defines the components on which to search and the text to search for
	 */
	protected async query(value: string): Promise<Component[]> {
		const api = await getCCIMSApi(this.context);
		return (await api?.searchComponents(value, this.minAmount, this.maxAmount)) ?? [];
	}
}