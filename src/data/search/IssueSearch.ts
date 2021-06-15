import { Issue } from "../../generated/graphql";
import { ApiSearch } from "./ApiSearch";

/**
 * Class to query the api for issues on specific components that match a specific text
 */
export class IssueSearch extends ApiSearch<{components: string[], text: string}, Issue> {

	/**
	 * Queries the api for Issues
	 * @param value defines the components on which to search and the text to search for
	 */
	protected query(value: { components: string[]; text: string; }): Promise<Issue[]> {
		throw new Error("Method not implemented.");
	}
}