import { Label } from "../../generated/graphql";
import { getCCIMSApi } from "../CCIMSApi";
import { ApiSearch } from "./ApiSearch";

/**
 * Class to query the api for labels on specific components that match a specific text
 */
export class LabelSearch extends ApiSearch<{components: string[], text: string}, Label> {

	/**
	 * Queries the api for Labels
	 * @param value defines the components on which to search and the text to search for
	 */
	protected async query(value: { components: string[]; text: string; }): Promise<Label[]> {
		const api = await getCCIMSApi(this.context);
		return (await api?.searchLabels(value.components, value.text, this.minAmount, this.maxAmount)) ?? [];
	}
}