<template>
    <div :class="(issue == null) ? 'collapsed' : ''">
        <div 
            id="title-container" 
            v-if="issue != null"
            class="container"
        >
            <div 
                class="codicon codicon-type-hierarchy"
                style="align-self: center"
            />
            <input 
                id="title-input" 
                class="flex-grow"
                v-model="issue.title"
                :disabled="mode == 'read'"
                placeholder="Enter Title"
            />
            <button 
                class="codicon"
                :class="{'codicon-edit': mode == 'read', 'codicon-save': mode != 'read'}"
                style="width: 42px"
                @click="updateMode(mode == 'read' ? 'edit' : 'read')"
            />
        </div>
        <div 
            id="body-container"
            class="container"
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
                        :commands="[{icon: 'codicon-trash', command: 'delete'}]"
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
                                @vsc-search-text="onSearchLabel($event.detail.value)"
                                @focusout="onLabelLostFocus()"
                                @vsc-change="onLabelSelected($event.detail.value)"
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
import { Issue, IssueCategory, Label } from "../../src/generated/graphql";
import { IssueViewMessage } from "../../src/issue-view/communication/IssueViewMessage";
import { OpenIssueMessage } from "../../src/issue-view/communication/OpenIssueMessage";
import { ThemeChangedMessage } from "../../src/issue-view/communication/ThemeChangedMessage";
import { CreateIssueMessage } from "../../src/issue-view/communication/CreateIssueMessage";
import { UpdateIssueMessage } from "../../src/issue-view/communication/UpdateIssueMessage";
import { SearchLabelsMessage } from "../../src/issue-view/communication/SearchLabelsMessage";
import { FoundLabelsMessage } from "../../src/issue-view/communication/FoundLabelsMessage";
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
     * The content definition for the TreeView which displays labels, assignees, linkedIssues and artifacts
     */
    private issueTreeContent: TreeViewContent[] = [];

    /**
     * The content definition for the labels
     */
    private labelsTreeContent: TreeViewContent | null = null;

    /**
     * The options for the label AddSelect
     */
    private labelOptions: NodeOption<Label>[] = [];

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
                console.log((message as FoundLabelsMessage).labels);
                this.labelOptions = (message as FoundLabelsMessage).labels.map(label => ({
                    label: label.name ?? "",
                    description: label.description ?? "",
                    value: label.id!,
                    selected: false,
                    node: label
                }));
                console.log(this.labelOptions);
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
            if (this.mode != "read" && this.issue != null && this.mdEditor != undefined) {
                this.issue.body = this.mdEditor.getValue();
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
                    category: this.issue.category
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
            lineDecorationsWidth: 0,
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
            }
        });

        let ignoreEvent = false;
        this.mdEditor.onDidContentSizeChange(sizeChangedEvent => {
            if (sizeChangedEvent.contentHeightChanged && !ignoreEvent) {
                ignoreEvent = true;
                this.layoutMonaco();
                ignoreEvent = false;
            }
        });
        window.addEventListener("resize", this.layoutMonaco);
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
        console.log(this.issue?.category);
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
                subcontents: (issue.labels?.nodes ?? []).filter(label => label != null).map(label => this.mapLabelToTreeViewContent(label as Label))
            }

            this.issueTreeContent = [
                this.labelsTreeContent
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
        console.log("on add label");
        if (this.labelsTreeContent != null && this.labelsTreeContent.subcontents != undefined) {
            this.labelsTreeContent.subcontents.unshift({
                id: "new",
                label: "new"
            });
            this.onSearchLabel("");
        }
    }

    private onDeleteLabel(id: string): void {
        console.log("on delete label: " + id);
    }

    private onSearchLabel(text: string): void {
        console.log("search label");
        console.log(event);
        this.postMessage({
            type: IssueViewMessageType.SEARCH_LABELS,
            text: text
        } as SearchLabelsMessage);
    }

    private onLabelLostFocus(): void {
        this.$nextTick(() => {
            if (this.labelsTreeContent?.subcontents?.[0]?.id == "new") {
                this.labelsTreeContent.subcontents.shift();
            }
        });
    }

    private onLabelSelected(id: string): void {
        console.log("selectd label");
        console.log(this.labelsTreeContent?.subcontents?.some(content => content.id == id));
        const canAdd = !(this.labelsTreeContent?.subcontents?.some(content => content.id == id) ?? true);
        if (canAdd) {
            console.log("does not contain yet");
            const newContent = this.labelsTreeContent?.subcontents?.[0] as ColorTreeViewContent;
            const label = this.labelOptions.find(option => option.value == id)?.node;
            console.log(newContent);
            console.log(label);
            if (newContent != undefined && label != undefined) {
                console.log("updte content");
                newContent.id = label.id!;
                newContent.label = label.name;
                newContent.color = label.color;
            }
        } else {
            this.labelsTreeContent?.subcontents?.shift();
        }
    }

}

/**
 * TreeViewContent with a color, used for labels
 */
interface ColorTreeViewContent extends TreeViewContent {
    color: string
}

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
        src: url("../node_modules/vscode-codicons/dist/codicon.ttf") format("font-truetype");
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
    }

    #title-input:disabled {
        background-color: unset;
    }

    #title-container {
        display: flex;
    }

    #md-editor {
        width: 100%;
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
</style>
