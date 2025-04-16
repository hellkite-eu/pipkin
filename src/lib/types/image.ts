import { JimpInstance } from 'jimp';
import { ScaleMode } from './scale';
import { AlignItems, JustifyContent } from './css';

export type ImageType = JimpInstance;

export type ImageRef<EntryType> =
    | { buffer: Buffer }
    | { path: string }
    | { absolutePath: string }
    | { key: keyof EntryType }
    | { pathFn: (entry: EntryType) => string };

export type ImageLayerOptions = {
    /**
     * Base path for the assets. Overrides the more global property of the template `defaultAssetsPath`.
     */
    assetsPath?: string;

    /**
     * default `center`
     */
    justifyContent?: JustifyContent;
    /**
     * default `center`
     */
    alignItems?: AlignItems;

    /**
     * Defaults to `none`
     */
    scale?: ScaleMode;

    // TODO:
    // processorFn?: (entry: EntryType, image: ImageType) => Promise<ImageType>;
};

export const DEFAULT_IMAGE_LAYER_OPTIONS: Required<
    Omit<ImageLayerOptions, 'assetsPath'>
> &
    Pick<ImageLayerOptions, 'assetsPath'> = {
    justifyContent: 'center',
    alignItems: 'center',
    scale: 'none',
};

export type Alignment = 'start' | 'center' | 'end';

export const DEFAULT_IMAGE_ALIGNMENT: Alignment = 'center';
