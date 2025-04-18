import { JimpInstance } from 'jimp';
import { ScaleMode } from './scale';
import { LayerOptions } from './layer';
import { RequiredDeep } from 'type-fest';

export type ImageType = JimpInstance;

export type ImageRef<EntryType extends Record<string, string>> =
    | { buffer: Buffer }
    | { path: string }
    | { absolutePath: string }
    | { key: keyof EntryType }
    | { pathFn: (entry: EntryType) => string };

export type ImageLayerOptions<EntryType extends Record<string, string>> =
    LayerOptions<EntryType> & {
        /**
         * Base path for the assets. Overrides the more global property of the template `defaultAssetsPath`.
         */
        assetsPath?: string;

        /**
         * Defaults to `none`
         */
        scale?: ScaleMode;

        // TODO:
        // processorFn?: (entry: EntryType, image: ImageType) => Promise<ImageType>;
    };

export const DEFAULT_IMAGE_LAYER_OPTIONS: RequiredDeep<ImageLayerOptions<Record<string, string>>> = {
    justifyContent: 'center',
    alignItems: 'center',
    scale: 'none',
    skip: false,
    assetsPath: ''
};

export type Alignment = 'start' | 'center' | 'end';

export const DEFAULT_IMAGE_ALIGNMENT: Alignment = 'center';
