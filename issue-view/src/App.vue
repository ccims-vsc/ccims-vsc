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
            v-slot="itemProps"
            :contents="testContents"
        >
            <tree-view-item
                :content="itemProps.content"
                :defaultInput="itemProps.defaultInput"
            >
                <template #subcontent="subcontentProps">
                    <tree-view-item
                        :content="subcontentProps.content"
                        :defaultInput="subcontentProps.defaultInput"
                        :commands="[{icon: 'codicon-file', command: 'new'}]"
                    >
                    </tree-view-item>
                </template>
            </tree-view-item>
        </tree-view-container>
        <button @click="testContents[0].subcontents.push({id: 'new', label: 'newer'})">TEST</button>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { VscodeSearchSelect } from "./components/VscodeSearchSelect";
import { Issue, IssueCategory } from "../../src/generated/graphql";
import { IssueViewMessage } from "../../src/issue-view/communication/IssueViewMessage";
import { OpenIssueMessage } from "../../src/issue-view/communication/OpenIssueMessage";
import { ThemeChangedMessage } from "../../src/issue-view/communication/ThemeChangedMessage";
import { CreateIssueMessage } from "../../src/issue-view/communication/CreateIssueMessage";
import { UpdateIssueMessage } from "../../src/issue-view/communication/UpdateIssueMessage";
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


if (!customElements.get("vscode-search-select")) {
    customElements.define("vscode-search-select", VscodeSearchSelect)
}
if (!customElements.get("vscode-single-select")) {
    customElements.define("vscode-single-select", VscodeSingleSelect);
}
if (!customElements.get("vscode-option")) {
    customElements.define("vscode-option", VscodeOption);
}

@Options({
    components: {
        TreeViewItem,
        TreeViewContainer
    }
})
export default class App extends Vue {


    private testContents = [{
        id: 'main',
        label: 'main',
        icon: 'codicon-file',
        isCodiconIcon: true,
        subcontents: [
            {
                id: '1', 
                label: 'hello'
            }, 
            {
                id: '2', 
                label: 'world'
            }
        ]
    }];








    /**
     * markdown instance used for rendering
     */
    private readonly md = markdownIt().use(emoji);

    /**
     * The issue which is currently displayed
     */
    private issue: Partial<Issue> & { body: string, title: string } | null = null;

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
    private issueChanged(): void {
        const categorySelect = document.getElementById("category-select") as VscodeSingleSelect | null;
        if (categorySelect != null) {
            categorySelect.selectedIndex = this.indexOfIssueCategory() ?? 0;
            (categorySelect as any)._onSlotChange();
        }
    }
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
