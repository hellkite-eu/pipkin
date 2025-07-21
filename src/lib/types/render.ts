export type RenderOptions<EntryType extends Record<string, string>> = {
    duplication?: DuplicationOptions<EntryType>;
};

export type DuplicationOptions<EntryType extends Record<string, string>> = {
    /**
     * Field used for determining how many copies of this entry should be.
     */
    countField: keyof EntryType;
    /**
     * Return the copies are complete clones, instead of same reference.
     * default false
     */
    deepCopy?: boolean;
    /**
     * Number of copies for each card that it will fallback
     * when the countField is not valid
     * default: 1
     */
    default?: number;
};
