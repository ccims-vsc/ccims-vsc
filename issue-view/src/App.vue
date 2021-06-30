<template>
    <div :class="(issue == null) ? 'collapsed' : ''">
        <div 
            id="title-container" 
            v-if="issue != null"
            class="container"
            style="margin-bottom: 5px"
        >
            <div style="display: flex; align-items: center">
                <img 
                    :src="iconTable[icon(issue)]"
                    style="align-self: center; height: 25px; flex: none"
                />
                <input 
                    id="title-input" 
                    class="flex-grow"
                    v-model="issue.title"
                    :disabled="mode == 'read'"
                    placeholder="Enter Title"
                />
                <div 
                    :disabled="mode != 'read' && (!issue.title || !issue.body)"
                    @click="updateMode(mode == 'read' ? 'edit' : 'read')"
                    class="icon-button"
                >
                    <div 
                        class="codicon"
                        :class="{'codicon-edit': mode == 'read', 'codicon-save': mode != 'read'}"
                    /> 
                </div>
            </div>
            <span 
                v-if="componentNames != null"
                style="color: var(--vscode-descriptionForeground);"
            >
                {{ componentNames }}
            </span>
        </div>
        <div 
            id="body-container"
            class="container"
            style="margin-bottom: 18px"
        >
            <div 
                v-html="compiledBody"
                v-if="mode == 'read' && issue != null"
            />
            <div :class="(mode == 'read') ? 'collapsed' : ''">
                <div
                    id="md-editor"
                    :style="`height: ${mdHeight}px`"
                />
            </div>
        </div>
        <div 
            id="category-container"
            class="container"
        >
            <vscode-single-select 
                id="category-select" 
                class="half-row"
                @vsc-change="onIssueCategoryChanged($event.detail.selectedIndex)"
            >
                <vscode-option description="Issue describes an error, flaw or fault">Bug</vscode-option>
                <vscode-option description="Issue describes a functionality that is to be implemented">Feature request</vscode-option>
                <vscode-option description="Not classified or not fitting in any other category">Unclassified</vscode-option>
            </vscode-single-select>
            <button 
                @click="onIssueClose" 
                v-if="issue != null && mode != 'new'"
                class="half-row"
            >
                {{ issue.isOpen ? "Close" : "Reopen" }}
            </button>
        </div>
        <tree-view-container 
            v-if="issue != null"
            v-slot="itemProps"
            :contents="issueTreeContent"
        >
            <tree-view-item
                v-if="itemProps.content.id == 'labels'"
                :content="itemProps.content"
                :defaultInput="itemProps.defaultInput"
                :commands="[{icon: 'codicon-plus', command: 'new'}]"
                @command="onAddLabel()"
            >
                <template #icon>
                    <div class="codicon codicon-output" />
                </template>
                <template #subcontent="labelProps">
                    <tree-view-item
                        :content="labelProps.content"
                        :defaultInput="labelProps.defaultInput"
                        :commands="[{icon: labelProps.content.id == 'new' ? 'codicon-close' : 'codicon-trash', command: 'delete'}]"
                        @command="onDeleteLabel(labelProps.content.id)"
                    >
                        <template #icon v-if="labelProps.content.id != 'new'">  
                            <div 
                                class="codicon codicon-circle-filled" 
                                :style="`color: ${labelProps.content.color};`"
                            />
                        </template>
                        <template #icon v-else>
                            <div
                                class="codicon codicon-plus"
                            />
                        </template>
                        <template v-if="labelProps.content.id == 'new'">
                            <add-select 
                                :options="labelOptions"
                                placeholder="Search for labels"
                                @vsc-search-text="onSearchLabel($event.detail.value)"
                                @focusout="onLabelLostFocus()"
                                @vsc-change="onNewLabelSelected($event.detail.value)"
                            />
                        </template>
                    </tree-view-item>
                </template>
            </tree-view-item>
            <tree-view-item
                v-else-if="itemProps.content.id == 'linkedIssues'"
                :content="itemProps.content"
                :defaultInput="itemProps.defaultInput"
                :commands="[{icon: 'codicon-plus', command: 'new'}]"
                @command="onAddLinkedIssue()"
            >
                <template #icon>
                    <div class="codicon codicon-reply" />
                </template>
                <template #subcontent="linkedIssueProps">
                    <tree-view-item
                        :content="linkedIssueProps.content"
                        :defaultInput="linkedIssueProps.defaultInput"
                        :commands="[{icon: linkedIssueProps.content.id == 'new' ? 'codicon-close' : 'codicon-trash', command: 'delete'}]"
                        @command="onDeleteLinkedIssue(linkedIssueProps.content.id)"
                        @selected="onLinkedIssueSelected(linkedIssueProps.content.id)"
                    >
                        <template #icon v-if="linkedIssueProps.content.id != 'new'">  
                            <img
                                :src="iconTable[getIssueIcon(linkedIssueProps.content.issue)]" 
                                style="width: 16px; height: 22px;"
                            />
                        </template>
                        <template #icon v-else>
                            <div
                                class="codicon codicon-plus"
                            />
                        </template>
                        <template v-if="linkedIssueProps.content.id == 'new'">
                            <add-select 
                                :options="linkedIssueOptions"
                                placeholder="Search for issues"
                                @vsc-search-text="onSearchLinkedIssue($event.detail.value)"
                                @focusout="onLinkedIssueLostFocus()"
                                @vsc-change="onNewLinkedIssueSelected($event.detail.value)"
                            />
                        </template>
                    </tree-view-item>
                </template>
            </tree-view-item>
            <tree-view-item
                v-if="itemProps.content.id == 'assignees'"
                :content="itemProps.content"
                :defaultInput="itemProps.defaultInput"
                :commands="[{icon: 'codicon-plus', command: 'new'}]"
                @command="onAddAssignee()"
            >
                <template #icon>
                    <div class="codicon codicon-account" />
                </template>
                <template #subcontent="assigneeProps">
                    <tree-view-item
                        :content="assigneeProps.content"
                        :defaultInput="assigneeProps.defaultInput"
                        :commands="[{icon: assigneeProps.content.id == 'new' ? 'codicon-close' : 'codicon-trash', command: 'delete'}]"
                        @command="onDeleteAssignee(assigneeProps.content.id)"
                    >
                        <template #icon v-if="assigneeProps.content.id != 'new'">  
                            <!--TODO-->
                        </template>
                        <template #icon v-else>
                            <div
                                class="codicon codicon-plus"
                            />
                        </template>
                        <template v-if="assigneeProps.content.id == 'new'">
                            <add-select 
                                :options="assigneeOptions"
                                placeholder="Search for users"
                                @vsc-search-text="onSearchAssignee($event.detail.value)"
                                @focusout="onAssigneeLostFocus()"
                                @vsc-change="onNewAssigneeSelected($event.detail.value)"
                            />
                        </template>
                    </tree-view-item>
                </template>
            </tree-view-item>
            <tree-view-item
                v-if="itemProps.content.id == 'artifacts'"
                :content="itemProps.content"
                :defaultInput="itemProps.defaultInput"
                :commands="[{icon: 'codicon-plus', command: 'new'}]"
                @command="onAddArtifact()"
            >
                <template #icon>
                    <div class="codicon codicon-file" />
                </template>
                <template #subcontent="artifactProps">
                    <tree-view-item
                        :content="artifactProps.content"
                        :defaultInput="artifactProps.defaultInput"
                        :commands="[{icon: artifactProps.content.id == 'new' ? 'codicon-close' : 'codicon-trash', command: 'delete'}]"
                        @command="onDeleteArtifact(artifactProps.content.id)"
                        @selected="onArtifactSelected(artifactProps.content.artifact, artifactProps.content.relativePath)"
                    >
                        <template #icon v-if="artifactProps.content.id == 'new'">  
                            <div 
                                class="codicon codicon-plus"
                            />
                        </template>
                        <template #icon v-else-if="artifactProps.content.relativePath">
                            <div
                                class="codicon codicon-file"
                            />
                        </template>
                        <template #icon v-else>
                            <div
                                class="codicon codicon-link-external"
                            />
                        </template>
                        <template v-if="artifactProps.content.id == 'new'">
                            <add-select 
                                :options="artifactOptions"
                                placeholder="Search for artifacts"
                                @vsc-search-text="onSearchArtifact($event.detail.value)"
                                @focusout="onArtifactLostFocus()"
                                @vsc-change="onNewArtifactSelected($event.detail.value)"
                            />
                        </template>
                    </tree-view-item>
                </template>
            </tree-view-item>
        </tree-view-container>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Artifact, Issue, IssueCategory, Label, User } from "../../src/generated/graphql";
import { IssueViewMessage } from "../../src/issue-view/communication/IssueViewMessage";
import { OpenIssueMessage } from "../../src/issue-view/communication/OpenIssueMessage";
import { ThemeChangedMessage } from "../../src/issue-view/communication/ThemeChangedMessage";
import { CreateIssueMessage } from "../../src/issue-view/communication/CreateIssueMessage";
import { UpdateIssueMessage } from "../../src/issue-view/communication/UpdateIssueMessage";
import { SearchLabelsMessage } from "../../src/issue-view/communication/SearchLabelsMessage";
import { FoundLabelsMessage } from "../../src/issue-view/communication/FoundLabelsMessage";
import { SearchIssuesMessage } from "../../src/issue-view/communication/SearchIssuesMessage";
import { FoundIssuesMessage } from "../../src/issue-view/communication/FoundIssuesMessage";
import { SearchUsersMessage } from "../../src/issue-view/communication/SearchUsersMessage";
import { FoundUsersMessage } from "../../src/issue-view/communication/FoundUsersMessage";
import { SearchArtifactsMessage } from "../../src/issue-view/communication/SearchArtifactsMessage";
import { FoundArtifactsMessage } from "../../src/issue-view/communication/FoundArtifactsMessage";
import { UserIdChangedMessage } from "../../src/issue-view/communication/UserIdChangedMessage";
import { IconTableMessage } from "../../src/issue-view/communication/IconTableMessage";
import { AddArtifactMessage } from "../../src/issue-view/communication/AddArtifactMessage";
import { ComplexListIconsChangedMessage } from "../../src/issue-view/communication/ComplexListIconsChangedMessage";
import { ComponentChangedMessage } from "../../src/issue-view/communication/ComponentChangedMessage";
import { OpenUrlMessage } from "../../src/issue-view/communication/OpenUrlMessage";
import { OpenFileMessage } from "../../src/issue-view/communication/OpenFileMessage";
import { IssueViewMessageType } from "../../src/issue-view/communication/IssueViewMessageType";
import markdownIt from 'markdown-it'
import emoji from 'markdown-it-emoji'
import { vscode } from "./main";
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown';
import { VscodeSingleSelect } from "@bendera/vscode-webview-elements";
import { VscodeOption } from "@bendera/vscode-webview-elements";
import { Watch } from "vue-property-decorator"
import { IssueDiff } from "../../src/issue-view/communication/IssueDiff";
import TreeViewItem from "./components/TreeViewItem.vue";
import TreeViewContainer from "./components/TreeViewContainer.vue";
import { TreeViewContent } from "./components/TreeViewContent";
import AddSelect from "./components/AddSelect.vue";
import { Option } from '@bendera/vscode-webview-elements/dist/vscode-select/includes/types';
import { getComplexIssueIcon, getSimpleIssueIcon } from "../../src/data/IconProvider";
import { ArtifactConfig } from "../../src/artifacts/ArtifactConfig";



if (!customElements.get("vscode-single-select")) {
    customElements.define("vscode-single-select", VscodeSingleSelect);
}
if (!customElements.get("vscode-option")) {
    customElements.define("vscode-option", VscodeOption);
}

@Options({
    components: {
        TreeViewItem,
        TreeViewContainer,
        AddSelect
    }
})
export default class App extends Vue {

    /**
     * markdown instance used for rendering
     */
    private readonly md = markdownIt().use(emoji);

    /**
     * The issue which is currently displayed
     */
    private issue: Partial<Issue> & { body: string, title: string } | null = null;

    /**
     * The id of the current user, used for complex icons
     */
    private userId: string | null = null;

    /**
     * The id of the current component
     */
    private componentId: string | null = null;

    /**
     * Artifact config used for all artifact related things
     */
    private artifactConfig: ArtifactConfig | null = null;

    /**
     * If true, the complex icons are used
     */
    private complexIcons: boolean = false;

    /**
     * Table with all icons
     */
    private iconTable: { [key: string]: string } = {};

    /**
     * The content definition for the TreeView which displays labels, assignees, linkedIssues and artifacts
     */
    private issueTreeContent: TreeViewContent[] = [];

    /**
     * The content definition for the labels
     */
    private labelsTreeContent: TreeViewContent<ColorTreeViewContent> | null = null;

    /**
     * The options for the label AddSelect
     */
    private labelOptions: NodeOption<Label>[] = [];

    /**
     * The content definition for the linkedIssues
     */
    private linkedIssuesTreeContent: TreeViewContent<IssueTreeViewContent> | null = null;

    /**
     * The options for the linkedIssue AddSelect
     */
    private linkedIssueOptions: NodeOption<Issue>[] = [];

    /**
     * The content definition for the assignees
     */
    private assigneesTreeContent: TreeViewContent | null = null;

    /**
     * The options for the assignee AddSelect
     */
    private assigneeOptions: NodeOption<User>[] = [];

    /**
     * The content definition for the artifacts
     */
    private artifactsTreeContent: TreeViewContent<ArtifactTreeViewContent> | null = null;

    /**
     * The options for the artifact AddSelect
     */
    private artifactOptions: NodeOption<Artifact>[] = [];

    /**
     * if true, the viewer is in edit mode
     */
    private mode: "edit" | "new" | "read" = "read";

    /**
     * Monaco editor instance for body
     */
    private mdEditor: monaco.editor.IStandaloneCodeEditor | undefined;

    /**
     * gets the compiled body
     */
    private get compiledBody(): string | null {
        if (this.issue != null) {
            return this.md.render(this.issue.body);
        } else {
            return null
        }
    }

    /**
     * Gets the text which is displayed to show on which components this issue is
     */
    private get componentNames(): string | null {
        if (this.issue != undefined) {
            return this.getComponentNames(this.issue);
        } else {
            return null;
        }
    }

    /**
     * Called on create, adds event listeners
     */
    created(): void {
        window.addEventListener("message", event => {
            const message = event.data;
            this.onMessage(message);
        });
    }

    /**
     * Called with a received message
     */
    private onMessage(message: IssueViewMessage): void {
        switch(message.type) {
            case IssueViewMessageType.OPEN_ISSUE: {
                this.updateMode("read", false);
                this.issue = (message as OpenIssueMessage).issue;
                break;
            }
            case IssueViewMessageType.THEME_CHANGED: {
                monaco.editor.setTheme((message as ThemeChangedMessage).theme);
                break;
            }
            case IssueViewMessageType.NEW_ISSUE: {
                this.updateMode("read", false); //TODO: better implementation which shows an error message because there are unsafed changes
                this.issue = {
                    title: "",
                    body: "",
                    category: IssueCategory.Unclassified
                };
                this.updateMode("new");
                break;
            }
            case IssueViewMessageType.FOUND_LABELS: {
                this.labelOptions = (message as FoundLabelsMessage).labels.map(label => ({
                    label: label.name ?? "",
                    description: label.description ?? "",
                    value: label.id!,
                    selected: false,
                    node: label
                }));
                break;
            }
            case IssueViewMessageType.FOUND_ISSUES: {
                this.linkedIssueOptions = (message as FoundIssuesMessage).issues.filter(issue => issue.id != this.issue?.id).map(issue => ({
                    label: issue.title ?? "",
                    description: issue.body ?? "",
                    value: issue.id!,
                    selected: false,
                    node: issue
                }));
                break;
            }
            case IssueViewMessageType.FOUND_USERS: {
                this.assigneeOptions = (message as FoundUsersMessage).users.map(assignee => ({
                    label: assignee.displayName ?? assignee.username ?? "",
                    description: assignee.username ?? "",
                    value: assignee.id!,
                    selected: false,
                    node: assignee
                }));
                break;
            }
            case IssueViewMessageType.FOUND_ARTIFACTS: {
                this.artifactOptions = (message as FoundArtifactsMessage).artifacts.map(artifact => ({
                    label: this.getArtifactRelativePath(artifact) ?? artifact.uri ?? "",
                    value: artifact.id!,
                    description: "",
                    selected: false,
                    node: artifact
                }));
                break;
            }
            case IssueViewMessageType.USER_ID_CHANGED: {
                this.userId = (message as UserIdChangedMessage).id ?? null;
                break;
            }
            case IssueViewMessageType.ICON_TABLE: {
                this.iconTable = (message as IconTableMessage).icons;
                break;
            }
            case IssueViewMessageType.COMPLEX_LIST_ICONS_CHANGED: {
                this.complexIcons = (message as ComplexListIconsChangedMessage).complex;
                break;
            }
            case IssueViewMessageType.COMPONENT_CHANGED: {
                const componentMessage = message as ComponentChangedMessage;
                this.componentId = componentMessage.componentId ?? null;
                if (componentMessage.repositoryURL != undefined && componentMessage.artifactSchema != undefined) {
                    this.artifactConfig = new ArtifactConfig(componentMessage.artifactSchema, componentMessage.repositoryURL);
                }
                break;
            }
            case IssueViewMessageType.ADD_ARTIFACT: {
                const addArtifactMessage = message as AddArtifactMessage;
                this.addArtifact(addArtifactMessage.artifact);
                break;
            }
        }
    }

    /**
     * Sends a message to the extension
     */
    private postMessage(message: IssueViewMessage): void {
        vscode.postMessage(message);
    }

    /**
     * Updates the current 
     */
    private updateMode(newMode: "new" | "edit" | "read", save = true): void {
        if (newMode != 'read') {
            if (this.mdEditor == undefined) {
                this.initMonaco();
            }
            this.mdEditor?.setValue(this.issue?.body ?? "");
        } else {
            if (this.mode != "read") {
                this.updateIssueBodyFromEditor();
            }
            if (this.issue != null && save) {
                if (this.mode == "new") {
                    this.sendCreateIssueMessage();
                } else if (this.mode == "edit") {
                    this.sendUpdateDiff({
                        title: this.issue.title,
                        body: this.issue.body,
                    });
                }
            }
        }
        this.mode = newMode;
    }

    /**
     * Updates the body of the issue based on the value of the mdEditor if possible
     */
    private updateIssueBodyFromEditor(): void {
        if (this.mdEditor != undefined && this.issue != null) {
            this.issue.body = this.mdEditor.getValue();
        }
    }

    /**
     * Sends a diff to update the current issue
     */
    private sendUpdateDiff(diff: IssueDiff): void {
        if (this.issue?.id != null) {
            this.postMessage({
                type: IssueViewMessageType.UPDATE_ISSUE,
                id: this.issue.id,
                diff: diff
            } as UpdateIssueMessage);
        }
    }

    /**
     * Sends a message to create a new Issue
     */
    private sendCreateIssueMessage(): void {
        if (this.issue != null) {
            this.postMessage({
                type: IssueViewMessageType.CREATE_ISSUE,
                diff: {
                    title: this.issue.title,
                    body: this.issue.body,
                    category: this.issue.category,
                    addedLabels: this.labelsTreeContent?.subcontents?.map(label => label.id),
                    addedLinkedIssues: this.linkedIssuesTreeContent?.subcontents?.map(issue => issue.id),
                    addedAssignees: this.assigneesTreeContent?.subcontents?.map(user => user.id),
                    addedArtifacts: this.artifactsTreeContent?.subcontents?.map(artifact => artifact.id)
                }
            } as CreateIssueMessage);
        }
    }

    /**
     * Initializes the body Monaco editor
     */
    private initMonaco(): void {
        this.mdEditor = monaco.editor.create(document.getElementById("md-editor")!, {
            value: "# Hello world",
            language: "markdown",
            lineNumbers: "off",
            lineNumbersMinChars: 0,
            lineDecorationsWidth: 5,
            folding: false,
            glyphMargin: false,
            minimap: {
                enabled: false
            },
            wordWrap: "on",
            overviewRulerLanes: 0,
            scrollBeyondLastLine: false,
            wrappingStrategy: "advanced",
            scrollbar: {
                alwaysConsumeMouseWheel: false
            },
            padding: {
                top: 5,
                bottom: 5
            },
            renderLineHighlightOnlyWhenFocus: true
        });

        let ignoreEvent = false;
        this.mdEditor.onDidContentSizeChange(sizeChangedEvent => {
            if (sizeChangedEvent.contentHeightChanged && !ignoreEvent) {
                ignoreEvent = true;
                this.layoutMonaco();
                ignoreEvent = false;
            }
        });
        this.mdEditor.onDidChangeModelContent(contentChangedEvent => {
            this.updateIssueBodyFromEditor();
        });
        window.addEventListener("resize", this.layoutMonaco);
        this.layoutMonaco();
    }

    /**
     * Layouts the editor
     */
    private layoutMonaco(): void {
        if (this.mdEditor != null) {
            try {
                this.mdEditor?.layout();
                this.mdEditor?.layout({
                    width: this.mdEditor.getLayoutInfo().width,
                    height:  Math.max(40, this.mdEditor.getContentHeight())
                });
            } catch(e) {
                console.error(e);
            }
        }
    }

    /**
     * Called to close or reopen the issue
     * Can only be called if not in 'new' mode
     */
    private onIssueClose(): void {
        if (this.mode == 'new') {
            throw new Error("Cannot close / reopen issue in new mode")
        }

        if (this.issue != null) {
            this.issue.isOpen = !this.issue.isOpen;
            this.sendUpdateDiff({
                isOpen: this.issue.isOpen
            });
        }
    }

    /**
     * Called when the issue category changes
     * @param index the index of the new IssueCategory
     */
    private onIssueCategoryChanged(index: number): void {
        const newCategory: IssueCategory = this.issueCategoryOfIndex(index);
        if (this.issue != null && this.issue.category != newCategory) {
            this.issue.category = newCategory;
            if (this.mode != 'new') {
                this.sendUpdateDiff({
                    category: newCategory
                });
            }
        }
    }

    /**
     * Gets the index of the IssueCategory of the current Issue
     * returns null if Issue is null
     */
    private indexOfIssueCategory(): number | null {
        if (this.issue == null) {
            return null;
        }
        switch(this.issue.category!) {
            case IssueCategory.Bug: {
                return 0;
            }
            case IssueCategory.FeatureRequest: {
                return 1;
            }
            case IssueCategory.Unclassified: {
                return 2;
            }
        }
    }

    private issueCategoryOfIndex(index: number): IssueCategory {
        switch(index) {
            case 0: {
                return IssueCategory.Bug;
            }
            case 1: {
                return IssueCategory.FeatureRequest;
            }
            case 2: {
                return IssueCategory.Unclassified;
            }
            default: {
                throw Error(`Unknown index of IssueCategory: ${index}`)
            }
        }
    }

    /**
     * Called when issue changes
     * Sets the correct value for all components that cannot update on their own
     */
    @Watch("issue")
    private issueChanged(newIssue: Partial<Issue> & { body: string, title: string } | null): void {
        const categorySelect = document.getElementById("category-select") as VscodeSingleSelect | null;
        if (categorySelect != null) {
            categorySelect.selectedIndex = this.indexOfIssueCategory() ?? 0;
            (categorySelect as any)._onSlotChange();
        }
        this.generateIssueTreeContent(newIssue);
    }

    /**
     * Generates the content of the TreeView based on an Issue
     */
    private generateIssueTreeContent(issue: Partial<Issue> & { body: string, title: string } | null): void {
        if (issue == null) {
            this.issueTreeContent = [];
        } else {
            this.labelsTreeContent = {
                id: "labels",
                label: "Labels",
                subcontents: (issue.labels?.nodes ?? [])
                    .filter(label => label != null)
                    .map(label => this.mapLabelToTreeViewContent(label as Label))
            }
            this.linkedIssuesTreeContent = {
                id: "linkedIssues",
                label: "Linked issues",
                subcontents: (issue.linksToIssues?.nodes ?? [])
                    .filter(linkedIssue => linkedIssue != null)
                    .map(linkedIssue => this.mapLinkedIssueToTreeViewContent(linkedIssue as Issue))
            }
            this.assigneesTreeContent = {
                id: "assignees",
                label: "Assignees",
                subcontents: (issue.assignees?.nodes ?? [])
                    .filter(assignee => assignee != null)
                    .map(assignee => this.mapAssigneeToTreeViewContent(assignee as User))
            }

            this.artifactsTreeContent = {
                id: "artifacts",
                label: "Artifacts",
                subcontents: (issue.artifacts?.nodes ?? [])
                    .filter(artifact => artifact != null)
                    .map(artifact => this.mapArtifactToTreeViewContent(artifact as Artifact))
            }

            this.issueTreeContent = [
                this.labelsTreeContent,
                this.linkedIssuesTreeContent,
                this.assigneesTreeContent,
                this.artifactsTreeContent
            ]
        }
    }

    /**
     * Maps a label to a TreeViewContent
     */
    private mapLabelToTreeViewContent(label: Label): ColorTreeViewContent {
        return {
            id: label.id!,
            label: label.name,
            color: label.color
        }
    }

    /**
     * Called when the add label button is pressed
     */
    private onAddLabel(): void {
        if (this.labelsTreeContent != null && this.labelsTreeContent.subcontents != undefined) {
            this.labelsTreeContent.subcontents.unshift({
                id: "new",
                label: "new",
                color: "#00000000"
            });
            this.onSearchLabel("");
        }
    }

    /**
     * Called to remove the label with the specified index from the current issue
     */
    private onDeleteLabel(id: string): void {
        const contentIndex = this.labelsTreeContent?.subcontents?.findIndex(content => content.id == id);
        if (contentIndex != undefined && contentIndex >= 0) {
            this.labelsTreeContent?.subcontents?.splice(contentIndex, 1);
            if (this.mode != "new") {
                this.sendUpdateDiff({
                    removedLabels: [id]  
                });
            }
        }
    }

    /**
     * Called when a new search text was entered
     */
    private onSearchLabel(text: string): void {
        this.postMessage({
            type: IssueViewMessageType.SEARCH_LABELS,
            text: text
        } as SearchLabelsMessage);
    }

    /**
     * Called when the label sarch input looses focus,
     * removes the temporary label element
     */
    private onLabelLostFocus(): void {
        this.$nextTick(() => {
            if (this.labelsTreeContent?.subcontents?.[0]?.id == "new") {
                this.labelsTreeContent.subcontents.shift();
            }
        });
    }

    /**
     * Called when a label is selected, 
     * replaces the temporary label element with the real label
     */
    private onNewLabelSelected(id: string): void {
        const canAdd = !(this.labelsTreeContent?.subcontents?.some(content => content.id == id) ?? true);
        if (canAdd) {
            const newContent = this.labelsTreeContent?.subcontents?.[0] as ColorTreeViewContent;
            const label = this.labelOptions.find(option => option.value == id)?.node;
            if (newContent != undefined && label != undefined) {
                newContent.id = label.id!;
                newContent.label = label.name;
                newContent.color = label.color;
            }
            if (this.mode != "new") {
                this.sendUpdateDiff({
                    addedLabels: [id]
                });
            }
        } else {
            this.labelsTreeContent?.subcontents?.shift();
        }
    }

    /**
     * Maps a linkedIssue to a TreeViewContent
     */
    private mapLinkedIssueToTreeViewContent(linkedIssue: Issue): IssueTreeViewContent {
        return {
            id: linkedIssue.id!,
            label: linkedIssue.title,
            description: this.getComponentNames(linkedIssue) ?? undefined,
            issue: linkedIssue
        }
    }

    /**
     * Called when the add linkedIssue button is pressed
     */
    private onAddLinkedIssue(): void {
        if (this.linkedIssuesTreeContent != null && this.linkedIssuesTreeContent.subcontents != undefined) {
            this.linkedIssuesTreeContent.subcontents.unshift({
                id: "new",
                label: "new",
                issue: null
            });
            this.onSearchLinkedIssue("");
        }
    }

    /**
     * Called to remove the linkedIssue with the specified index from the current issue
     */
    private onDeleteLinkedIssue(id: string): void {
        const contentIndex = this.linkedIssuesTreeContent?.subcontents?.findIndex(content => content.id == id);
        if (contentIndex != undefined && contentIndex >= 0) {
            this.linkedIssuesTreeContent?.subcontents?.splice(contentIndex, 1);
            if (this.mode != "new") {
                this.sendUpdateDiff({
                    removedLinkedIssues: [id]  
                });
            }
        }
    }

    /**
     * Called when a new search text was entered
     */
    private onSearchLinkedIssue(text: string): void {
        this.postMessage({
            type: IssueViewMessageType.SEARCH_ISSUES,
            text: text
        } as SearchIssuesMessage);
    }

    /**
     * Called when the linkedIssue sarch input looses focus,
     * removes the temporary linkedIssue element
     */
    private onLinkedIssueLostFocus(): void {
        this.$nextTick(() => {
            if (this.linkedIssuesTreeContent?.subcontents?.[0]?.id == "new") {
                this.linkedIssuesTreeContent.subcontents.shift();
            }
        });
    }

    /**
     * Called when a linkedIssue is selected, 
     * replaces the temporary linkedIssue element with the real linkedIssue
     */
    private onNewLinkedIssueSelected(id: string): void {
        const canAdd = !(this.linkedIssuesTreeContent?.subcontents?.some(content => content.id == id) ?? true);
        if (canAdd) {
            const newContent = this.linkedIssuesTreeContent?.subcontents?.[0] as IssueTreeViewContent;
            const linkedIssue = this.linkedIssueOptions.find(option => option.value == id)?.node;
            if (newContent != undefined && linkedIssue != undefined) {
                newContent.id = linkedIssue.id!;
                newContent.label = linkedIssue.title;
                newContent.description = this.getComponentNames(linkedIssue) ?? undefined;
                newContent.issue = linkedIssue;
            }
            if (this.mode != "new") {
                this.sendUpdateDiff({
                    addedLinkedIssues: [id]
                });
            }
        } else {
            this.linkedIssuesTreeContent?.subcontents?.shift();
        }
    }

    /**
     * Called when a linked issue is selected
     * Opens the selected issue
     * @param id the id of the selected issue
     */
    private onLinkedIssueSelected(id: string): void {
        if (id != "new") {
            this.postMessage({
                type: IssueViewMessageType.OPEN_ISSUE,
                issue: {
                    id: id
                }
            } as OpenIssueMessage);
        }
    }

    /**
     * Maps a assignee to a TreeViewContent
     */
    private mapAssigneeToTreeViewContent(assignee: User): TreeViewContent {
        return {
            id: assignee.id!,
            label: assignee.displayName ?? assignee.username,
        }
    }

    /**
     * Called when the add assignee button is pressed
     */
    private onAddAssignee(): void {
        if (this.assigneesTreeContent != null && this.assigneesTreeContent.subcontents != undefined) {
            this.assigneesTreeContent.subcontents.unshift({
                id: "new",
                label: "new"
            });
        }
    }

    /**
     * Called to remove the assignee with the specified index from the current issue
     */
    private onDeleteAssignee(id: string): void {
        const contentIndex = this.assigneesTreeContent?.subcontents?.findIndex(content => content.id == id);
        if (contentIndex != undefined && contentIndex >= 0) {
            this.assigneesTreeContent?.subcontents?.splice(contentIndex, 1);
            if (this.mode != "new") {
                this.sendUpdateDiff({
                    removedAssignees: [id]  
                });
            }
        }
    }

    /**
     * Called when a new search text was entered
     */
    private onSearchAssignee(text: string): void {
        this.postMessage({
            type: IssueViewMessageType.SEARCH_USERS,
            text: text
        } as SearchUsersMessage);
    }

    /**
     * Called when the assignee sarch input looses focus,
     * removes the temporary assignee element
     */
    private onAssigneeLostFocus(): void {
        this.$nextTick(() => {
            if (this.assigneesTreeContent?.subcontents?.[0]?.id == "new") {
                this.assigneesTreeContent.subcontents.shift();
            }
        });
    }

    /**
     * Called when a assignee is selected, 
     * replaces the temporary assignee element with the real assignee
     */
    private onNewAssigneeSelected(id: string): void {
        const canAdd = !(this.assigneesTreeContent?.subcontents?.some(content => content.id == id) ?? true);
        if (canAdd) {
            const newContent = this.assigneesTreeContent?.subcontents?.[0] as TreeViewContent;
            const assignee = this.assigneeOptions.find(option => option.value == id)?.node;
            if (newContent != undefined && assignee != undefined) {
                newContent.id = assignee.id!;
                newContent.label = assignee.displayName ?? assignee.username;
            }
            if (this.mode != "new") {
                this.sendUpdateDiff({
                    addedAssignees: [id]
                });
            }
        } else {
            this.assigneesTreeContent?.subcontents?.shift();
        }
    }

    /**
     * Maps a artifact to a TreeViewContent
     */
    private mapArtifactToTreeViewContent(artifact: Artifact): ArtifactTreeViewContent {
        let description = undefined;
        if (artifact.lineRangeStart != undefined ||artifact.lineRangeEnd != undefined) {
            description = `${artifact.lineRangeStart ?? ""} - ${artifact.lineRangeEnd ?? ""}`
        }
        const relativePath = this.getArtifactRelativePath(artifact)
        return {
            id: artifact.id!,
            label: relativePath ?? artifact.uri,
            description: description,
            relativePath: relativePath,
            artifact: artifact
        }
    }

    /**
     * Called when the add artifact button is pressed
     */
    private onAddArtifact(): void {
        if (this.artifactsTreeContent != null && this.artifactsTreeContent.subcontents != undefined) {
            this.artifactsTreeContent.subcontents.unshift({
                id: "new",
                label: "new",
                artifact: null
            });
            this.onSearchArtifact("");
        }
    }

    /**
     * Called to remove the artifact with the specified index from the current issue
     */
    private onDeleteArtifact(id: string): void {
        const contentIndex = this.artifactsTreeContent?.subcontents?.findIndex(content => content.id == id);
        if (contentIndex != undefined && contentIndex >= 0) {
            this.artifactsTreeContent?.subcontents?.splice(contentIndex, 1);
            if (this.mode != "new") {
                this.sendUpdateDiff({
                    removedArtifacts: [id]  
                });
            }
        }
    }

    /**
     * Called when a new search text was entered
     */
    private onSearchArtifact(text: string): void {
        this.postMessage({
            type: IssueViewMessageType.SEARCH_ARTIFACTS,
            text: text
        } as SearchArtifactsMessage);
    }

    /**
     * Called when the artifact sarch input looses focus,
     * removes the temporary artifact element
     */
    private onArtifactLostFocus(): void {
        this.$nextTick(() => {
            if (this.artifactsTreeContent?.subcontents?.[0]?.id == "new") {
                this.artifactsTreeContent.subcontents.shift();
            }
        });
    }

    /**
     * Called when a artifact is selected, 
     * replaces the temporary artifact element with the real artifact
     */
    private onNewArtifactSelected(id: string): void {
        const canAdd = !(this.artifactsTreeContent?.subcontents?.some(content => content.id == id) ?? true);
        if (canAdd) {
            const newContent = this.artifactsTreeContent?.subcontents?.[0] as ArtifactTreeViewContent;
            const artifact = this.artifactOptions.find(option => option.value == id)?.node;
            this.setToNewArtifact(newContent, artifact);
        } else {
            this.artifactsTreeContent?.subcontents?.shift();
        }
    }

    /**
     * Sets an ArtifactTreeViewContent to a new Artifact
     */
    private setToNewArtifact(newContent?: ArtifactTreeViewContent, artifact?: Artifact): void {
        if (newContent != undefined && artifact != undefined) {
            newContent.id = artifact.id!;
            newContent.relativePath = this.getArtifactRelativePath(artifact);
            newContent.label = newContent.relativePath ?? artifact.uri;
            newContent.artifact = artifact;
            if (artifact.lineRangeStart != undefined || artifact.lineRangeEnd != undefined) {
                newContent.description = `${artifact.lineRangeStart ?? ""} - ${artifact.lineRangeEnd ?? ""}`;
            }
            if (this.mode != "new") {
                this.sendUpdateDiff({
                    addedArtifacts: [artifact?.id!]
                });
            }
        }
    }

    /**
     * Adds an artifact to the current Issue
     */
    private addArtifact(artifact: Artifact) {
        if (this.artifactsTreeContent?.subcontents != undefined) {
            const content = {
                id: "new",
                label: "new",
                artifact: null
            };
            this.artifactsTreeContent.subcontents.unshift(content);
            this.setToNewArtifact(content, artifact);
        }
        
    }

    /**
     * Called when an artifact is selected
     * Opens the selected artifact
     * @param artifact the selected Artifact
     * @param relativePath the relativePath of the Artifact
     */
    private onArtifactSelected(artifact: Artifact | null, relativePath?: string): void {
        if (artifact != null) {
            if (relativePath != undefined) {
                this.postMessage({
                    type: IssueViewMessageType.OPEN_FILE,
                    file: relativePath,
                    lineRangeStart: (artifact.lineRangeStart ?? artifact.lineRangeEnd ?? 1) - 1,
                    lineRangeEnd: (artifact.lineRangeEnd ?? artifact.lineRangeStart ?? 1) - 1
                } as OpenFileMessage);
            } else {
                this.postMessage({
                    type: IssueViewMessageType.OPEN_URL,
                    url: artifact.uri
                } as OpenUrlMessage);
            }
        }
    }
    
    /**
     * Gets the icon of the issue
     */
    private icon(): string {
        return getComplexIssueIcon(
            this.issue?.category ?? IssueCategory.Unclassified, 
            this.issue?.isOpen ?? true, 
            this.linkedIssuesTreeContent?.subcontents?.some(content => content.id != "new") ?? false,
            ((this.issue?.linkedByIssues?.nodes?.length ?? 0) > 0),
            this.assigneesTreeContent?.subcontents?.some(content => content.id == (this.userId ?? "")) ?? false
        );
    }

    /**
     * Gets the simple icon for the issue
     * requires that both category and isOpen are provided
     * @param issue the issue to get the icon for
     * @returns the icon
     */
    private getIssueIcon(issue: Issue): string {
        if (this.complexIcons) {
            return getComplexIssueIcon(
                issue.category, 
                issue.isOpen, 
                (issue.linksToIssues?.nodes?.length ?? 0) > 0,
                (issue.linkedByIssues?.nodes?.length ?? 0) > 0  || (this.linkedIssuesTreeContent?.subcontents?.some(content => content.id == this.issue?.id) ?? false),
                issue.assignees?.nodes?.some(user => user?.id === this.userId) ?? false
            );
        } else {
            return getSimpleIssueIcon(
                issue.category,
                issue.isOpen
            );
        }
    }

    /**
     * Gets the names of the components of a specific issue
     */
    private getComponentNames(issue: Partial<Issue>): string | null {
        const components = issue?.components?.nodes?.filter(component => component != undefined);
        if (components != undefined && components.length > 0) {
            if (components.length === 1) {
                const component = components[0];
                if (component?.id !== this.componentId) {
                    return component?.name ?? null;
                } else {
                    return null;
                }
            } else {
                return components?.map(component => component?.name)
                    ?.filter(name => name != undefined)?.join(", ") ?? null;
            }
        } else {
            return null;
        }
    }

    /**
     * Gets the relative path for an artifact if possible
     */
    private getArtifactRelativePath(artifact: Artifact): string | undefined {
        if (this.artifactConfig != undefined) {
            if (this.artifactConfig.matchesArtifactUrl(artifact.uri)) {
                return this.artifactConfig.urlToPath(artifact.uri);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }
 }

/**
 * TreeViewContent with a color, used for labels
 */
interface ColorTreeViewContent extends TreeViewContent {
    color: string
}

/**
 * TreeViewContent with a color, used for labels
 */
interface IssueTreeViewContent extends TreeViewContent {
    issue: Issue | null
}

/**
 * TreeViewContend for an Artifact
 * if relativePath is set, the artifact represents a file in the repository
 */
interface ArtifactTreeViewContent extends TreeViewContent {
    artifact: Artifact | null,
    relativePath?: string
}

/**
 * Option which adds a node
 */
interface NodeOption<T> extends Option {
    node: T
}

</script>

<style>
    @import url("./css/reset.css");
    @import url("./css/vscode.css");
    @import url("../node_modules/vscode-codicons/dist/codicon.css");
    @font-face {
        font-family: "codicon";
        src: url("./fonts/codicon.ttf") format("font-truetype");
    }

    body {
        background-color: var(--vscode-sideBar-background);
        padding-left: 0px;
        padding-right: 0px;
    }

    #title-input {
        font-size: large;
        margin-left: 10px;
        margin-right: 10px;
        text-overflow: ellipsis;
    }

    #title-input:disabled {
        background-color: unset;
    }

    #md-editor {
        width: 100%;
        outline: 1px solid transparent;
        outline-offset: 1px;
    }

    #md-editor:focus-within {
        outline-color: var(--vscode-focusBorder);
    }

    .collapsed {
        height: 0px;
        visibility: hidden
    }

    #category-container {
        display: flex;
        justify-content: space-between;
        width: 100%;
    }

    .half-row {
        width: calc(50% - 10px);
    }

    .container {
        padding-left: 8px;
        padding-right: 8px;
        margin-bottom: 10px;
    }

    .icon-button {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        border-radius: 5px;
    }
    .icon-button:hover {
        background-color: var(--vscode-toolbar-hoverBackground);
    }
</style>
