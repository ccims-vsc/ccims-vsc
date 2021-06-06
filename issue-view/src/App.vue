<template>
    <div>
        <h1>Hello world</h1>
        <vscode-search-select placeholder="hello world select"/>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { VscodeSearchSelect } from "./components/VscodeSearchSelect";

if (!customElements.get("vscode-search-select")) {
    customElements.define("vscode-search-select", VscodeSearchSelect)
}

@Options({})
export default class App extends Vue {
    
}
</script>

<style>
    @import "./css/reset.css";
    @import "./css/vscode.css";
</style>
