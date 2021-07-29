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
                                class="svg-mask-icon"
                                :style="unclassifiedIssueIconMask" 
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
                                class="svg-mask-icon"
                                :style="bugIconMask" 
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
                                class="svg-mask-icon"
                                :style="featureRequestIconMask" 
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
                            <img v-if="issueFilter.showOpen"
                                class="svg-icon"
                                :src="openUnclassifiedIssueIcon"
                            />
                            <div v-if="!issueFilter.showOpen"
                                class="svg-mask-icon"
                                :style="openIssueIconMask"
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
                            <img v-if="issueFilter.showClosed"
                                class="svg-icon"
                                :src="closedUnclassifiedIssueIcon"
                            />
                            <div v-if="!issueFilter.showClosed"
                                class="svg-mask-icon"
                                :style="closedIssueIconMask"
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
    <div v-else-if="currentStatusMessage != undefined" class="message-container">
        {{
            currentStatusMessage.text
        }}
        <button 
            class="message-button"
            v-for="(buttonData, idx) in currentStatusMessage.buttons" :key="idx"
            @click="postExecuteCommand(buttonData.command)"
        >
            {{
                buttonData.text
            }}
        </button>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Watch } from "vue-property-decorator"
import { IssueFilter } from "../../src/data/IssueFilter";
import { ComponentViewMessageType } from "../../src/component-view/communication/ComponentViewMessageType";
import { UpdateComponentMessage } from "../../src/component-view/communication/UpdateComponentMessage";
import { UpdateIssueFilterMessage } from "../../src/component-view/communication/UpdateIssueFilterMessage";
import { UpdateApiStatusMessage } from "../../src/component-view/communication/UpdateApiStatusMessage";
import { ExecuteCommandMessage } from "../../src/component-view/communication/ExecuteCommandMessage";
import { IconTableMessage } from "../../src/component-view/communication/IconTableMessage";
import { CCIMSCommandType } from "../../src/commands/CCIMSCommandType";
import { ApiStatus } from "../../src/data/ApiStatus"
import { Component, IssueCategory } from "../../src/generated/graphql";
import { vscode } from "./main";
import { getSimpleIssueIcon } from "../../src/data/IconProvider";



@Options({
    
})
export default class App extends Vue {

    /**
     * Lookup for API Status messages
     */
    private apiStatusMessages: Map<ApiStatus, MessageData> = new Map();

    /**
     * Current api status
     */
    private currentApiStatus = ApiStatus.NOMINAL;

    /**
     * Gets the message for the current status
     */
    private get currentStatusMessage(): MessageData | undefined {
        return this.apiStatusMessages.get(this.currentApiStatus);
    }

    /**
     * The issue which is currently displayed
     */
    private component: Component | null = null;

    /**
     * Table with all icons
     */
    private iconTable: { [key: string]: string } = {};

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

    private get openUnclassifiedIssueIcon(): string {
        return this.iconTable[getSimpleIssueIcon(IssueCategory.Unclassified, true)]
    }

    private get closedUnclassifiedIssueIcon(): string {
        return this.iconTable[getSimpleIssueIcon(IssueCategory.Unclassified, false)]
    }

    private get unclassifiedIssueIconMask(): string {
        return this.maskString(this.openUnclassifiedIssueIcon);
    }

    private get bugIconMask(): string {
        return this.maskString(this.iconTable[getSimpleIssueIcon(IssueCategory.Bug, true)]);
    }

    private get featureRequestIconMask(): string {
        return this.maskString(this.iconTable[getSimpleIssueIcon(IssueCategory.FeatureRequest, true)]);
    }

    private get openIssueIconMask(): string {
        return this.maskString(this.openUnclassifiedIssueIcon);
    }

    private get closedIssueIconMask(): string {
        return this.maskString(this.closedUnclassifiedIssueIcon);
    }

    /**
     * Called on create, adds event listeners
     */
    created(): void {
        window.addEventListener("message", event => {
            const message = event.data;
            this.onMessage(message);
        });
        this.initStatusMessages();
    }

    /**
     * Called when initialized, used to notify initialized
     */
    mounted(): void {
        this.postMessage({
            type: ComponentViewMessageType.NOTIFY_INITIALIZED
        });
    }

    private initStatusMessages(): void {
        this.apiStatusMessages.set(ApiStatus.NO_URL, {
            text: "The api URL is currently not set",
            buttons: [
                {
                    text: "Setup extension",
                    command: CCIMSCommandType.SETUP_EXTENSION
                },
                {
                    text: "Open Settings",
                    command: "workbench.action.openSettings2"
                }
            ]
        });
        this.apiStatusMessages.set(ApiStatus.NOT_REACHABLE, {
            text: "The api is currently not available.",
            buttons: [
                {
                    text: "Setup extension",
                    command: CCIMSCommandType.SETUP_EXTENSION
                },
                {
                    text: "Check again",
                    command: CCIMSCommandType.CHECK_API_STATUS
                },
                {
                    text: "Open Settings",
                    command: "workbench.action.openSettings2"
                }
            ]
        });
        this.apiStatusMessages.set(ApiStatus.NO_LOGIN, {
            text: "You are currently not logged in.",
            buttons: [
                {
                    text: "Login",
                    command: CCIMSCommandType.LOGIN
                }
            ]
        });
        this.apiStatusMessages.set(ApiStatus.NOT_AVAILABLE, {
            text: "Your login data is invalid.",
            buttons: [
                {
                    text: "Login",
                    command: CCIMSCommandType.LOGIN
                }
            ]
        });
        this.apiStatusMessages.set(ApiStatus.NO_COMPONENT, {
            text: "There is no component configured.",
            buttons: [
                {
                    text: "Select component",
                    command: CCIMSCommandType.SELECT_COMPONENT
                },
                {
                    text: "Open Settings",
                    command: "workbench.action.openSettings2"
                }
            ]
        });
        this.apiStatusMessages.set(ApiStatus.COMPONENT_NOT_AVAILABLE, {
            text: "The currently configured component does not exist or is not accessible.",
            buttons: [
                {
                    text: "Select component",
                    command: CCIMSCommandType.SELECT_COMPONENT
                },
                {
                    text: "Open Settings",
                    command: "workbench.action.openSettings2"
                }
            ]
        });
        this.apiStatusMessages.set(ApiStatus.NO_FOLDER, {
            text: "In order to use CCIMS features, please open a folder.",
            buttons: [
                {
                    text: "Open Folder",
                    command: "vscode.openFolder"
                }
            ]
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
            case ComponentViewMessageType.UPDATE_API_STATUS:{
                const updateApiStatusMessage = message as UpdateApiStatusMessage;
                this.currentApiStatus = updateApiStatusMessage.apiStatus;
                break;
            }
            case ComponentViewMessageType.ICON_TABLE: {
                this.iconTable = (message as IconTableMessage).icons;
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

    /**
     * Sends a message to execute a command
     */
    private postExecuteCommand(command: CCIMSCommandType | string): void {
        this.postMessage({
            type: ComponentViewMessageType.EXECUTE_COMMAND,
            command: command
        } as ExecuteCommandMessage);
    }

    @Watch("issueFilter", { deep: true })
    private issueFilterUpdated(): void {
        this.postUpdateFilter();
    }

    private maskString(value: string): string {
        return `-webkit-mask: url(${value}) 0 0 / 19px 19px`;
    }

}

/**
 * Defines the data for a message button
 */
interface MessageButtonData {
    text: string,
    command: CCIMSCommandType | string
}

/**
 * Defines the data for a message
 */
interface MessageData {
    text: string,
    buttons: MessageButtonData[]
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

    .message-container {
        margin-left: 20px;
        margin-right: 20px;
    }

    .message-button {
        margin-block-start: 1em;
        margin-left: 6px;
        width: calc(100% - 12px);
    }


    .svg-icon,
    .svg-mask-icon {
        width: 19px;
        height: 19px;
        user-select: none;
    }

    .svg-mask-icon {
        background-color: var(--vscode-foreground);
    }
</style>
