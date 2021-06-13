export interface TreeViewContent {
    /**
     * The id of the content
     */
    id: string,
    /**
     * The label of the content
     */
    label: string,
    branchIcon?: IconDef,
    openIcon?: IconDef,
    leafIcon?: IconDef,
    /**
     * Subcontents
     */
    subcontents?: TreeViewContent[]
}

export interface IconDef {
    /**
     * The icon of the content
     */
    icon: string,
    /**
     * If true, icon is a codicon icon
     * otherwise icon is the path of the svg
     */
    isCodiconIcon?: boolean,
}