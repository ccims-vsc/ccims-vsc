<template>
    <div :class="(component == null) ? 'collapsed' : ''">
        
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Component } from "../../src/generated/graphql";
import { vscode } from "./main";


@Options({
    
})
export default class App extends Vue {

    /**
     * The issue which is currently displayed
     */
    private component: Partial<Component> | null = null;

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
            
        }
    }

    /**
     * Sends a message to the extension
     */
    private postMessage(message: any): void {
        vscode.postMessage(message);
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
</style>
