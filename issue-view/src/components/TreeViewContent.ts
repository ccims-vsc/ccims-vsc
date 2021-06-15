export interface TreeViewContent {
    /**
     * The id of the content
     */
    id: string,
    /**
     * The label of the content
     */
    label: string,
    /**
     * Subcontents
     */
    subcontents?: TreeViewContent[]
}