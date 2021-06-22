import { ArtifactSchema } from "../../artifacts/ArtifactConfig";
import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to notify that the componentId changed
 */
export interface ComponentChangedMessage extends IssueViewMessage {
	type: IssueViewMessageType.COMPONENT_CHANGED,
	componentId?: string,
	repositoryURL?: string,
	artifactSchema?: ArtifactSchema
}