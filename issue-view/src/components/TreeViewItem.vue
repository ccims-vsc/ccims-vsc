<template>
    <span 
        ref="mainSpan"
        class="contents" 
        :class="{
            'selected': selected
        }"
        :style="`padding-left: ${defaultInput.ident * 8}px`"
        tabindex="-1"
        @click="onMainSpanInput()"
        @keyup.up.stop="focusPrevious()"
        @keyup.down.stop="focusNext()"
        @keyup.space.stop="onMainSpanInput()"
        @keyup.enter.stop="onMainSpanInput()"
    >
        <dic 
            v-if="arrows"
            class="icon-arrow"
            style="flex: none;"
            :class="{
                'codicon': hasSubcontents,
                'codicon-chevron-right': !open && hasSubcontents,
                'codicon-chevron-down': open && hasSubcontents
            }"
        />
        <div 
            class="label-icon-container"
            style="align-self: center; flex: none;"
        >
            <slot name="icon"/>
        </div>
        <slot>
            <span 
                v-if="mode == 'default'"
                class="label"
            >
                {{ content.label }}
            </span>
            <span
                v-if="mode == 'default' && content.description"
                class="label description"
            >
                {{ content.description }}
            </span>
        </slot>
        <div style="margin-left: auto; align-self: center;">
            <div 
                class="command-icon-container"
                v-for="{ icon, command } in commands" :key="command"
                @click.stop="$emit('command', command)"
            >
                <div
                    class="codicon command-icon"
                    :class="icon"
                />
            </div>
        </div>
    </span>
    <tree-view-container
        v-if="hasSubcontents && open"
        v-slot="subcontentProps"
        :contents="content.subcontents"
        :defaultInput="{
            ident: defaultInput.ident + 1,
            emitBubbleUnselect: onBubbleUnselect,
            emitBubbleFocusNext: onBubbleFocusNext,
            emitBubbleFocusPrevious: onBubbleFocusPrevious,
            emitBubbleSelected: onBubbleSelected,
            register: (component) => { subcontentContainer = component }
        }"
    >
        <slot
            name="subcontent"
            :content="subcontentProps.content"
            :defaultInput="subcontentProps.defaultInput"
        />
    </tree-view-container>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { VscodeIcon } from "@bendera/vscode-webview-elements";
import { TreeViewContent } from "./TreeViewContent";
import TreeViewContainer from "./TreeViewContainer.vue";


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
    components: {
        TreeViewContainer
    }
})
export default class TreeViewItem extends Vue {
    /**
     * The content which is displayed
     */
    @Prop()
    public content!: TreeViewContent;

    /**
     * The display mode (default for vscode list entry)
     */
    @Prop({ default: "default" })
    public mode!: string;

    /**
     * The identation of this item
     */
    @Prop({ default: 1 })
    public ident!: number;

    /**
     * If true, arrows before folders are rendered
     */
    @Prop({ default: true })
    public arrows!: boolean;

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
     * Property for all commands
     */
    @Prop({ default: [] })
    public commands!: { icon: string, command: string }[];

    /**
     * If this element is open
     */
    private open = true;

    /**
     * If true, this element is selected
     */
    private selected = false;

    /**
     * Returns true if the content has subcontents
     */
    private get hasSubcontents(): boolean {
        return this.content.subcontents != null && this.content.subcontents.length > 0;
    }

    private subcontentContainer: TreeViewContainer | undefined;

    private get mainSpan(): HTMLSpanElement | undefined {
        return this.$refs.mainSpan as HTMLSpanElement | undefined;
    }
    

    private bubbleUnselect(): void {
        this.defaultInput.emitBubbleUnselect();
    }

    private onBubbleUnselect(): void {
        if (this.selected) {
            this.selected = false;
        } else {
            this.bubbleUnselect();
        }
    }

    private bubbleFocusNext(): void {
        this.defaultInput.emitBubbleFocusNext();
    }

    private onBubbleFocusNext(): void {
        this.bubbleFocusNext();
    }

    private bubbleFocusPrevious(): void {
        this.defaultInput.emitBubbleFocusPrevious();
    }

    private onBubbleFocusPrevious(): void {
        this.focus();
    }

    private onBubbleSelected(): void {
        this.defaultInput.emitBubbleSelected();
    }

    public focus(): void {
        this.mainSpan?.focus();
    }

    private select(): void {
        if (!this.selected) {
            this.defaultInput.emitBubbleUnselect();
            this.selected = true;
            this.$emit("selected");
            this.defaultInput.emitBubbleSelected();
        }
    }

    public unselect(): void {
        if (this.selected) {
            this.selected = false;
        } else {
            this.subcontentContainer?.unselect();
        }
    }

    public focusLast(): void {
        if (this.hasSubcontents) {
            this.subcontentContainer?.focusLast();
        } else {
            this.focus();
        }
    }

    private onMainSpanInput(): void {
        this.focus();
        this.select();
        if (this.hasSubcontents) {
            this.toggleOpen();
        }
    }

    private toggleOpen(): void {
        this.open = !this.open;
    }

    private focusPrevious(): void {
        this.bubbleFocusPrevious();
    }

    private focusNext(): void {
        if (this.hasSubcontents) {
            this.subcontentContainer?.focusFirst();
        } else {
            this.bubbleFocusNext();
        }
    }

    mounted(): void {
        this.defaultInput.register(this);
    }
}

export interface DefaultInput {
    emitBubbleUnselect: () => any,
    emitBubbleFocusNext: () => any,
    emitBubbleFocusPrevious: () => any,
    emitBubbleSelected: () => any,
    register: (component: any) => any,
    ident: number
}
</script>
<style scoped>
.contents {
    align-items: center;
    display: flex;
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    font-weight: var(--vscode-font-weight);
    outline: none;
}
.multi .contents {
    align-items: flex-start;
}
.contents:hover {
    background-color: var(--vscode-list-hoverBackground);
    cursor: pointer;
}
.contents.selected {
    background-color: var(--vscode-list-inactiveSelectionBackground);
}
ul:focus-within .contents.selected {
    background-color: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
}
.contents:focus {
    outline-offset: -1px;
    outline: 1px solid;
}
.contents:not(:focus):focus-within {
    outline-offset: -1px;
    outline: 1px solid;
    background-color: var(--vscode-settings-numberInputBackground);
    outline-color: var(--vscode-focusBorder);
}
.icon-arrow {
    display: block;
    margin: 3px 2px 3px 0;
    width: 16px;
    height: 16px;
    font-size: 16px;
}
.label-icon-container {
    display: flex;
    margin-right: 6px;
    width: 16px;
    font-size: 16px;
}

.command-icon {
    width: 16px;
    height: 16px;
    font-size: 16px;
}
.command-icon-container {
    width: 22px;
    height: 21px;
    border-radius: 5px;
    padding: 3px;
    margin-right: 4px;
    display: none;
}
.contents:hover .command-icon-container,
.contents.selected .command-icon-container,
.contents:focus-within .command-icon-container {
    display: block;
}
.command-icon-container:hover {
    background-color: var(--vscode-toolbar-hoverBackground);
}

.multi .contents .label-icon {
    margin-top: 3px;
}
.label {
    display: block;
    line-height: 22px;
    user-select: none;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}
.single .label {
    overflow: hidden;
    white-space: nowrap;
}
.description {
    font-size: .9em;
    opacity: .8;
    margin-left: .5em;
    line-height: calc(22px - 0.07em);
    margin-top: 0.07em;
}

@import url("../../node_modules/vscode-codicons/dist/codicon.css");
@font-face {
    font-family: "codicon";
    src: url("../../node_modules/vscode-codicons/dist/codicon.ttf") format("font-truetype");
}
</style>