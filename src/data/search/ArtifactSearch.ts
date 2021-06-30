import { Artifact } from "../../generated/graphql";
import { getCCIMSApi } from "../CCIMSApi";
import { ApiSearch } from "./ApiSearch";

/**
 * Class to query the api for artifacts on specific components that match a specific text
 */
export class ArtifactSearch extends ApiSearch<{ projects: string[], components: string[], text: string }, Artifact> {

	/**
	 * Queries the api for Artifacts
	 * @param value defines the components on which to search and the text to search for
	 */
	protected async query(value: { projects: string[], components: string[], text: string }): Promise<Artifact[]> {
		const api = await getCCIMSApi(this.context);
		return (await api?.searchArtifacts(value.projects, value.components, value.text, this.minAmount, this.maxAmount)) ?? [];
	}
}