import { debounce, throttle } from "../../util/decorators";
import { CCIMSApi } from "../CCIMSApi";

/**
 * Class which provides abstraction for query based searching
 * @param T the input type of a search request
 * @param R the result type of a search request
 */
export abstract class ApiSearch<T, R> {

	/**
	 * Creates a new ApiSearch
	 * @param minAmount the min amount of requested nodes
	 * @param maxAmount the max amount of requested nodes
	 */
	public constructor(protected readonly api: CCIMSApi, protected readonly minAmount: number, protected readonly maxAmount: number) {}

	/**
	 * Called to get new results
	 * @param value the new value of the input field
	 */
	//@debounce(300)
	public async search(value: T): Promise<R[]> {
		return await this._queryWrapper(value);
	}
 
	 /**
	  * Wraps the query method with a throttle wrapper
	  * @param value the value to search for
	  */
	@throttle
	private async _queryWrapper(value: T): Promise<R[]> {
		return await this.query(value);
	}

	/**
	 * Must be overwritten to query for results
	 * @param value the value to search for
	 */
	protected abstract query(value: T): Promise<R[]>;
}