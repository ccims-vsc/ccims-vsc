export interface TreeViewContent<T extends TreeViewContent = any> {
    /**
     * The id of the content
     */
    id: string,
    /**
     * The label of the content
     */
    label: string,
    /**
     * The description of the content, displayed after the label
     */
    description?: string,
    /**
     * Subcontents
     */
    subcontents?: T[]
}