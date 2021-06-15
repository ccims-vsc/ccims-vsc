import { Artifact } from "../../generated/graphql";
import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to inform the webview about the found Artifacts
 */
export interface FoundArtifactsMessage extends IssueViewMessage {
	type: IssueViewMessageType.FOUND_ARTIFACTS,
	artifacts: Artifact[]
}