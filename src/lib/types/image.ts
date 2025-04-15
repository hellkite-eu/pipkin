import { JimpInstance } from 'jimp';
import { ScaleMode } from './scale';

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
     * Overridden by xAlignment and/or yAlignment if provided.
     * default `center`
     */
    alignment?: Alignment;
    /**
     * default `center`
     */
    xAlignment?: Alignment;
    /**
     * default `center`
     */
    yAlignment?: Alignment;

    /**
     * Defaults to `none`
     */
    scale?: ScaleMode;

    // TODO:
    // processorFn?: (entry: EntryType, image: ImageType) => Promise<ImageType>;
};

export type Alignment = 'start' | 'center' | 'end';

export const DEFAULT_IMAGE_ALIGNMENT: Alignment = 'center';


