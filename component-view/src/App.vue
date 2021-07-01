<template>
    <div v-if="component">
        <div  class="container">
            <div style="display: flex; margin-bottom: 2px">
                <label id="name-label" style="flex-grow: 1;">
                    {{ component.name }}
                </label>
            </div>
            <label id="description-label">
                {{ component.description }}
            </label>
        </div>
        
        <div class="container">
            <div style="display: flex; margin-bottom: 5px">
                <input 
                    v-model="issueFilter.filter"
                    placeholder="Search for issues"
                    style="flex-grow: 1"
                />
            </div>

            <div style="flex-wrap: wrap" class="horizontal-align">
                <div class="horizontal-align">
                    <div class="icon-button-container">
                        <div 
                            class="icon-button"
                            :style="!issueFilter.showUnclassified ? 'opacity: 0.8' : ''"
                            @click="issueFilter.showUnclassified = !issueFilter.showUnclassified"
                            :title="issueFilter.showUnclassified ? 'Hide unclassified issues' : 'Show unclassified issues'"
                        >
                            <div
                                class="codicon codicon-issues"
                            />
                            <div
                                v-if="!issueFilter.showUnclassified"
                                class="crossed"
                            />
                        </div>
                    </div>
                    <div class="icon-button-container">
                        <div 
                            class="icon-button"
                            :style="!issueFilter.showBugs ? 'opacity: 0.8' : ''"
                            @click="issueFilter.showBugs = !issueFilter.showBugs"
                            :title="issueFilter.showBugs ? 'Hide bugs' : 'Show bugs'"
                        >
                            <div
                                class="codicon codicon-bug"
                            />
                            <div
                                v-if="!issueFilter.showBugs"
                                class="crossed"
                            />
                        </div>
                    </div>
                    <div class="icon-button-container">
                        <div 
                            class="icon-button"
                            :style="!issueFilter.showFeatureRequests ? 'opacity: 0.8' : ''"
                            @click="issueFilter.showFeatureRequests = !issueFilter.showFeatureRequests"
                            :title="issueFilter.showFeatureRequests ? 'Hide feature requests' : 'Show feature requests'"
                        >
                            <div
                                class="codicon codicon-lightbulb"
                            />
                            <div
                                v-if="!issueFilter.showFeatureRequests"
                                class="crossed"
                            />
                        </div>
                    </div>

                    <div class="vr"/>
                </div>

                <div class="horizontal-align">
                    <div class="icon-button-container">
                        <div 
                            class="icon-button"
                            :style="!issueFilter.showOpen ? 'opacity: 0.8' : 'color: #00b700'"
                            @click="issueFilter.showOpen = !issueFilter.showOpen"
                            :title="issueFilter.showOpen ? 'Hide open issues' : 'Show open issues'"
                        >
                            <div
                                class="codicon codicon-issues"
                            />
                            <div
                                v-if="!issueFilter.showOpen"
                                class="crossed"
                            />
                        </div>
                    </div>
                    <div class="icon-button-container">
                        <div 
                            class="icon-button"
                            :style="!issueFilter.showClosed ? 'opacity: 0.8' : 'color: #ff0000'"
                            @click="issueFilter.showClosed = !issueFilter.showClosed"
                            :title="issueFilter.showClosed ? 'Hide closed issues' : 'Show closed issues'"
                        >
                            <div
                                class="codicon codicon-pass"
                            />
                            <div
                                v-if="!issueFilter.showClosed"
                                class="crossed"
                            />
                        </div>
                    </div>

                    <div class="vr"/>
                </div>

                <div class="horizontal-align">
                    <div class="icon-button-container">
                        <div 
                            class="icon-button"
                            :style="issueFilter.showOnlySelfAssigned ? 'color: #ffc500' : ''"
                            @click="issueFilter.showOnlySelfAssigned = !issueFilter.showOnlySelfAssigned"
                            :title="issueFilter.showOnlySelfAssigned ? 'Show all issues' : 'Show only self-assigned issues'"
                        >
                            <div
                                v-if="issueFilter.showOnlySelfAssigned"
                                class="codicon codicon-star-full"
                            />
                            <div
                                v-if="!issueFilter.showOnlySelfAssigned"
                                class="codicon codicon-star"
                            />
                        </div>
                    </div>

                    <div class="vr" v-if="issueFilter.showOnlyIssuesRegardingFile"/>
                </div>

                <div 
                    class="icon-button-container"
                    v-if="issueFilter.showOnlyIssuesRegardingFile"
                >
                        <div 
                            class="icon-button"
                            @click="issueFilter.showOnlyIssuesRegardingFile = null"
                            title="Remove file-filter"
                        >
                            <div
                                class="codicon codicon-file"
                            />
                        </div>
                    </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Watch } from "vue-property-decorator"
import { IssueFilter } from "../../src/data/IssueFilter";
import { ComponentViewMessageType } from "../../src/component-view/communication/ComponentViewMessageType";
import { UpdateComponentMessage } from "../../src/component-view/communication/UpdateComponentMessage";
import { UpdateIssueFilterMessage } from "../../src/component-view/communication/UpdateIssueFilterMessage";
import { Component } from "../../src/generated/graphql";
import { vscode } from "./main";


@Options({
    
})
export default class App extends Vue {

    /**
     * The issue which is currently displayed
     */
    private component: Component | null = null;

    private issueFilter: IssueFilter = {
		filter: "",
		showUnclassified: true,
		showBugs: true,
		showFeatureRequests: true,
		showOpen: true,
		showClosed: true,
		showOnlySelfAssigned: false,
		showOnlyIssuesRegardingFile: null
	}

    /**
     * Table with all icons
     */
    private iconTable: { [key: string]: string } = {};

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
    private onMessage(message: any): void {
        switch(message.type) {
            case ComponentViewMessageType.UPDATE_COMPONENT: {
                const componentMessage = message as UpdateComponentMessage;
                this.component = componentMessage.component;
                break;
            }
            case ComponentViewMessageType.UPDATE_ISSUE_FILTER: {
                const updateFilterMessage = message as UpdateIssueFilterMessage;
                this.issueFilter = updateFilterMessage.filter;
                break;
            }
        }
    }

    /**
     * Sends a message to the extension
     */
    private postMessage(message: any): void {
        vscode.postMessage(message);
    }

    /**
     * Sends a message that the issue filter is updated
     */
    private postUpdateFilter(): void {
        this.postMessage({
            type: ComponentViewMessageType.UPDATE_ISSUE_FILTER,
            filter: {
                filter: this.issueFilter.filter,
                showUnclassified: this.issueFilter.showUnclassified,
                showBugs: this.issueFilter.showBugs,
                showFeatureRequests: this.issueFilter.showFeatureRequests,
                showOpen: this.issueFilter.showOpen,
                showClosed: this.issueFilter.showClosed,
                showOnlySelfAssigned: this.issueFilter.showOnlySelfAssigned,
                showOnlyIssuesRegardingFile: this.issueFilter.showOnlyIssuesRegardingFile
            }
        } as UpdateIssueFilterMessage);
    }

    @Watch("issueFilter", { deep: true })
    private issueFilterUpdated(): void {
        this.postUpdateFilter();
    }

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

    .collapsed {
        height: 0px;
        visibility: hidden
    }

    .container {
        padding-left: 8px;
        padding-right: 8px;
        margin-bottom: 10px;
    }

    #name-label {
        font-size: large;
        text-overflow: ellipsis;
    }

    #description-label {
        white-space: pre-wrap;
    }

    .icon-button {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
    }

    .icon-button-container {
                border-radius: 5px;
    }
    .icon-button-container:hover {
        background-color: var(--vscode-toolbar-hoverBackground);
    }

    .vr {
        border-left: 1px solid;
        border-color: var(--vscode-menu-separatorBackground);
        height: 20px;
        margin-left: 5px;
        margin-right: 5px;
    }

    .crossed {
        position: absolute;
        border-top: 2px solid;
        width: 25px;
        transform: rotate(45deg) translateY(1px);
    }

    .horizontal-align {
        display: flex;
        align-items: center; 
    }
</style>
