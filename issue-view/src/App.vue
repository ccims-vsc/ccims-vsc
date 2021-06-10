<template>
    <div id="title-container" v-if="issue != null">
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
            :class="mode == 'read' ? 'codicon-edit' : 'codicon-save'"
            style="width: 42px"
            @click="updateMode(mode == 'read' ? 'edit' : 'read')"
        />
    </div>
    <div id="body-container">
        <div 
            v-html="compiledBody"
            v-if="mode == 'read' && issue != null"
        />
        <div :style="(mode == 'read' || issue == null) ? 'height: 0px; visibility: hidden' : ''">
            <div
                id="md-editor"
                :style="`height: ${mdHeight}px`"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { VscodeSearchSelect } from "./components/VscodeSearchSelect";
import { Issue } from "../../src/generated/graphql";
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

if (!customElements.get("vscode-search-select")) {
    customElements.define("vscode-search-select", VscodeSearchSelect)
}

@Options({
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
     * if true, the viewer is in edit mode
     */
    private mode: "edit" | "new" | "read" = "read";

    /**
     * Monaco editor instance for body
     */
    private mdEditor: monaco.editor.IStandaloneCodeEditor | undefined;

    /**
     * The height of the mdEditor div
     */
    private mdHeight: number = 40;

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
                    body: ""
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
    private updateMode(newMode: "new" | "edit" | "read", save = true) {
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
                    this.postMessage({
                        type: IssueViewMessageType.CREATE_ISSUE,
                        title: this.issue.title,
                        body: this.issue.body
                    } as CreateIssueMessage);
                } else if (this.mode == "edit") {
                    this.postMessage({
                        type: IssueViewMessageType.UPDATE_ISSUE,
                        title: this.issue.title,
                        body: this.issue.body,
                        id: this.issue.id
                    } as UpdateIssueMessage);
                }
            }
        }
        this.mode = newMode;
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
                this.mdHeight = Math.max(40, sizeChangedEvent.contentHeight);
                try {
                    this.mdEditor?.layout({
                        width: this.mdEditor.getLayoutInfo().width,
                        height: this.mdHeight
                    });
                } finally {
                    ignoreEvent = false;
                }
            }
        });
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
        margin-bottom: 10px;
    }

    #md-editor {
        width: 100%;
    }
</style>
