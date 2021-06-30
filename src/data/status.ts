import { ExtensionContext } from "vscode";
import { isApiAvailable, isApiReachable, isComponentAvailable } from "./CCIMSApi";
import { CCIMSContext, setContext } from "./CCIMSContext";
import { getApiUrl, getComponentId } from "./settings";

/**
 * Updates the status of the api
 */
export async function updateApiStatus(context: ExtensionContext): Promise<void> {
	if (getApiUrl() == undefined) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NO_URL);
	} else if (!await isApiReachable()) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NOT_REACHABLE);
	} else if (false) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NO_LOGIN);
	} else if (!await isApiAvailable(context)) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NOT_AVAILABLE);
	} else if (getComponentId() == undefined) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NO_COMPONENT);
	} else if (!await isComponentAvailable(context)) {
		setContext(CCIMSContext.API_STATUS, ApiStatus.COMPONENT_NOT_AVAILABLE);
	} else {
		setContext(CCIMSContext.API_STATUS, ApiStatus.NOMINAL);
	}
}

/**
 * Different possible api status
 */
export enum ApiStatus {
	NOMINAL = 1,
	NO_URL = 2,
	NOT_REACHABLE = 3,
	NO_LOGIN = 4,
	NOT_AVAILABLE = 5,
	NO_COMPONENT = 6,
	COMPONENT_NOT_AVAILABLE = 7
}