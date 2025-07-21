import { RequiredDeep } from 'type-fest';
import { JustifyContent, AlignItems } from './css';
import { HyperNode } from './hypernode';

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

    /**
     * Control if should render bounding box for this layer
     */
    renderBoundingBox?: boolean;
};

export const DEFAULT_LAYER_OPTIONS: RequiredDeep<
    LayerOptions<Record<string, string>>
> = {
    justifyContent: 'center',
    alignItems: 'center',
    skip: false,
    renderBoundingBox: false,
};

export type LayerFnContext = {};

export type LayerFn<EntryType> = (
    entry: EntryType,
    context: LayerFnContext,
) => Promise<Array<HyperNode>>;
