import { User } from "../../generated/graphql";
import { ApiSearch } from "./ApiSearch";

/**
 * Class to query the api for users on specific components that match a specific text
 */
export class UserSearch extends ApiSearch<string, User> {

	/**
	 * Queries the api for Users
	 * @param value defines the components on which to search and the text to search for
	 */
	protected async query(value: string): Promise<User[]> {
		return (await this.api.searchUsers({ text: value}))?.searchUser;
	}
}