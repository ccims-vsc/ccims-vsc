<template>
    <div v-if="_issue != null">
        <h1>
            {{ _issue?.title }}
        </h1>
        <div v-html="_issue?.bodyRendered"/>
        <vscode-search-select placeholder="hello world select"/>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { VscodeSearchSelect } from "./components/VscodeSearchSelect";
import { Issue } from "../../src/generated/graphql";
import { IssueViewCommand } from "../../src/issue-view/communication/IssueViewCommand";
import { OpenIssueCommand } from "../../src/issue-view/communication/OpenIssueCommand";
import { IssueViewCommandType } from "../../src/issue-view/communication/IssueViewCommandType";

import { vscode } from "./main";

if (!customElements.get("vscode-search-select")) {
    customElements.define("vscode-search-select", VscodeSearchSelect)
}

@Options({})
export default class App extends Vue {

    /**
     * The issue which is currently displayed
     */
    private _issue: Issue | null = null;

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
                this._issue = (command as OpenIssueCommand).issue;
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
    @import "./css/reset.css";
    @import "./css/vscode.css";
    body {
        background-color: var(--vscode-sideBar-background)
    }
</style>
