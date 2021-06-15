import { Issue } from "../../generated/graphql";
import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to inform the webview about the found Issues
 */
export interface FoundIssuesMessage extends IssueViewMessage {
	type: IssueViewMessageType.FOUND_ISSUES,
	issues: Issue[]
}