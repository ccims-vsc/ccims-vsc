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
     * Subcontents
     */
    subcontents?: T[]
}