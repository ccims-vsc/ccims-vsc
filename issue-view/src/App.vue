<template>
    <div v-if="issue != null">
        <h1>
            {{ issue?.title }}
        </h1>
        <div v-html="compiledBody"/>
        <vscode-search-select placeholder="hello world select"/>
        <div class="icon"><i class="codicon codicon-edit" style="content: '\ea73'"></i> edit</div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { VscodeSearchSelect } from "./components/VscodeSearchSelect";
import { Issue } from "../../src/generated/graphql";
import { IssueViewCommand } from "../../src/issue-view/communication/IssueViewCommand";
import { OpenIssueCommand } from "../../src/issue-view/communication/OpenIssueCommand";
import { IssueViewCommandType } from "../../src/issue-view/communication/IssueViewCommandType";
import markdownIt from 'markdown-it'
import emoji from 'markdown-it-emoji'
import { vscode } from "./main";

if (!customElements.get("vscode-search-select")) {
    customElements.define("vscode-search-select", VscodeSearchSelect)
}

@Options({})
export default class App extends Vue {

    /**
     * markdown instance used for rendering
     */
    private readonly md = markdownIt().use(emoji);

    /**
     * The issue which is currently displayed
     */
    private issue: Issue | null = null;

    /**
     * if true, the viewer is in edit mode
     */
    private editMode: boolean = false;

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
     * Called on create, 
     */
    created(): void {
        window.addEventListener("message", event => {
            const command = event.data;
            this._onCommand(command);
        })
    }

    /**
     * Called with a received command
     */
    private _onCommand(command: IssueViewCommand): void {
        switch(command.type) {
            case IssueViewCommandType.OPEN_ISSUE: {
                this.issue = (command as OpenIssueCommand).issue;
                break;
            }
        }
    }

    /**
     * Sends a command to the extension
     */
    private _postCommand(command: IssueViewCommand): void {
        vscode.postMessage(command);
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
</style>
