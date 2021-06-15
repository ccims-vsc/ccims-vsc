<template>
    <vscode-search-select 
        ref="searchSelect"
        :placeholder="placeholder"
        @click.stop=""
        @keyup.stop=""
    />
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { VscodeSearchSelect } from "./VscodeSearchSelect";
import { Option } from '@bendera/vscode-webview-elements/dist/vscode-select/includes/types';



if (!customElements.get("vscode-search-select")) {
    customElements.define("vscode-search-select", VscodeSearchSelect)
}

/**
 * Component used for InsertTrees (for labels, artifacts and assignees)
 * Throws the following events:
 * - search: search for new input text (param = search text)
 * - add: adds an element (param = id of element to add)
 * - remove: removes an element (param = id of element to remove)
 */
@Options({
})
export default class AddSelect extends Vue {
    
    /**
     * The current options of the SearchSelect
     */
    @Prop({ default: [] })
    public options!: Option[];

    /**
     * The text displayed when no input is given
     */
    @Prop({ default: "" })
    public placeholder!: string;

    /**
     * Wachtes for changes on options and updates the component if necessary
     */
    @Watch("options")
    private onOptionsChanged(newOptions: Option[]): void {
        (this.$refs.searchSelect as VscodeSearchSelect).options = newOptions;
    }

    mounted(): void {
        this.$nextTick(() => {
            (this.$refs.searchSelect as VscodeSearchSelect).focusInput();
            this.onOptionsChanged(this.options);
        });
    }
}
</script>
<style>
    vscode-search-select {
        flex-grow: 1;
        padding: 1px;
        width: min-content;
    }
</style>