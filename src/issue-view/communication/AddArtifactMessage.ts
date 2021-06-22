import { Artifact } from "../../generated/graphql";
import { IssueDiff } from "./IssueDiff";
import { IssueViewMessage } from "./IssueViewMessage";
import { IssueViewMessageType } from "./IssueViewMessageType";

/**
 * Message to inform the frontend that an Artifact should be added
 */
export interface AddArtifactMessage extends IssueViewMessage {
	type: IssueViewMessageType.ADD_ARTIFACT,
	artifact: Artifact
}