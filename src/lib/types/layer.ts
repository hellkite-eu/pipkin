import { JustifyContent, AlignItems } from "./css";

export type LayerOptions<EntryType extends Record<string, string>> = {
    /**
     * default `center`
     */
    justifyContent?: JustifyContent;

    /**
     * default `center`
     */
    alignItems?: AlignItems;

    /**
     * Decides if a layer should be rendered or not for a certain entry
     */
    skip?: boolean | ((entry: EntryType) => boolean);
};
