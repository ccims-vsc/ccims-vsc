<template>
    <ul>
        <li v-for="content in contents" :key="content.id">
            <slot 
                :content="content" 
                :defaultInput="{
                    ident: defaultInput.ident,
                    emitBubbleUnselect: () => onBubbleUnselect(content.id),
                    emitBubbleFocusNext: () => onBubbleFocusNext(content.id),
                    emitBubbleFocusPrevious: () => onBubbleFocusPrevious(content.id),
                    emitBubbleSelected: () => onBubbleSelected(content.id),
                    register: (component) => registerSubcomponent(content.id, component)
                }"
            />
        </li>
    </ul>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { VscodeIcon } from "@bendera/vscode-webview-elements";
import { TreeViewContent } from "./TreeViewContent"
import TreeViewItem, { DefaultInput } from "./TreeViewItem.vue";


if (!customElements.get("vscode-icon")) {
    customElements.define("vscode-icon", VscodeIcon)
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
export default class TreeViewContainer extends Vue {
    /**
     * List of all items for which 
     */
    @Prop()
    public contents!: TreeViewContent[];

    /**
     * Default input which should be provided by the outer component
     */
    @Prop({ default: {
        emitBubbleUnselect: () => null,
        emitBubbleFocusNext: () => null,
        emitBubbleFocusPrevious: () => null,
        emitBubbleSelected: () => null,
        register: (component: any) => null,
        ident: 1
    }})
    public defaultInput!: DefaultInput;

    /**
     * The id of the selected selected subcomponent
     */
    private selectedContentId: string | undefined;

    private subcomponents: Map<string, TreeViewItem> = new Map();

    private registerSubcomponent(id: string, component: TreeViewItem): void {
        this.subcomponents.set(id, component);
    }

    private findContentIndex(id: string): number {
        return this.contents.findIndex(content => content.id == id);
    }

    private onBubbleUnselect(id: string): void {
        if (this.selectedContentId != undefined) {
            this.subcomponents.get(this.selectedContentId)?.unselect();
            this.selectedContentId = undefined;
        } else {
            this.defaultInput.emitBubbleUnselect();
        }
    }

    private onBubbleFocusNext(id: string): void {
        const index = this.findContentIndex(id);
        if (index >= this.contents.length - 1) {
            this.defaultInput.emitBubbleFocusNext();
        } else {
            this.subcomponents.get(this.contents[index + 1].id)?.focus();
        }
    }

    private onBubbleFocusPrevious(id: string): void {
        const index = this.findContentIndex(id);
        if (index <= 0) {
            this.defaultInput.emitBubbleFocusPrevious();
        } else {
            this.subcomponents.get(this.contents[index - 1].id)?.focusLast();
        }
    }

    private onBubbleSelected(id: string): void {
        this.selectedContentId = id;
        this.defaultInput.emitBubbleSelected();
    }

    public unselect(): void {
        if (this.selectedContentId != undefined) {
            this.subcomponents.get(this.selectedContentId)?.unselect();
            this.selectedContentId = undefined;
        }
    }

    public focusFirst(): void {
        this.subcomponents.get(this.contents[0].id)?.focus();
    }

    public focusLast(): void {
        this.subcomponents.get(this.contents[this.contents.length - 1].id)?.focusLast();
    }

    mounted(): void {
        this.defaultInput.register(this);
    }
}
</script>
<style scoped>
li {
    list-style: none;
}
ul,
li {
    margin: 0;
    padding: 0;
}
</style>