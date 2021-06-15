import { User } from "../../generated/graphql";
import { ApiSearch } from "./ApiSearch";

/**
 * Class to query the api for users on specific components that match a specific text
 */
export class UserSearch extends ApiSearch<{components: string[], text: string}, User> {

	/**
	 * Queries the api for Users
	 * @param value defines the components on which to search and the text to search for
	 */
	protected query(value: { components: string[]; text: string; }): Promise<User[]> {
		throw new Error("Method not implemented.");
	}
}