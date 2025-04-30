import { JimpInstance } from 'jimp';
import { ScaleMode } from './scale';
import { LayerOptions } from './layer';
import { RequiredDeep } from 'type-fest';

export type ImageType = JimpInstance;

/**
 * Static images -> `buffer`, `path`, `absolutePath`
 * Dynamic images -> `key`, `pathFn`
 */
export type ImageRef<EntryType extends Record<string, string>> =
    | StaticImageRef
    | { key: keyof EntryType }
    | { pathFn: (entry: EntryType) => string };

export type StaticImageRef =
    | { buffer: Buffer }
    | { path: string }
    | { absolutePath: string };

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

export const DEFAULT_IMAGE_LAYER_OPTIONS: RequiredDeep<
    ImageLayerOptions<Record<string, string>>
> = {
    justifyContent: 'center',
    alignItems: 'center',
    scale: 'none',
    skip: false,
    assetsPath: '',
};

export type ImageLayerSpecificOptions<
    EntryType extends Record<string, string>,
> = Omit<ImageLayerOptions<EntryType>, keyof LayerOptions<EntryType>>;

export type Alignment = 'start' | 'center' | 'end';

export const DEFAULT_IMAGE_ALIGNMENT: Alignment = 'center';
