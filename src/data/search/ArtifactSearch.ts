import { Artifact } from "../../generated/graphql";
import { ApiSearch } from "./ApiSearch";

/**
 * Class to query the api for artifacts on specific components that match a specific text
 */
export class ArtifactSearch extends ApiSearch<{components: string[], text: string}, Artifact> {

	/**
	 * Queries the api for Artifacts
	 * @param value defines the components on which to search and the text to search for
	 */
	protected query(value: { components: string[]; text: string; }): Promise<Artifact[]> {
		throw new Error("Method not implemented.");
	}
}