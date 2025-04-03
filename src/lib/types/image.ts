import { JimpInstance } from 'jimp';
import { BoundingBox, Point, Size } from './2d';

export type ImageType = JimpInstance;

export type ImageLayerProps<EntryType> = (
    | {
          key: keyof EntryType;
          path?: undefined;
      }
    | {
          key?: undefined;
          path: string;
      }
) & {
    position: ImagePosition;
    options?: ImageLayerOptions;
};

export type ImageLayerOptions = {
    assetsPath?: string;
    pathFn?: (path: string) => string;
    // TODO:
    // processorFn?: (entry: EntryType, image: ImageType) => Promise<ImageType>;
};

export type ImagePosition = ImageAlignmentProps & ScaleProps & BoundingBox;

export type ImageAlignmentProps = {
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
};

export type Alignment = 'start' | 'center' | 'end';

export const DEFAULT_IMAGE_ALIGNMENT: Alignment = 'center';

/**
 * Behavior of the content around a space
 * that is bigger or smaller than necessary
 * -> `none`: no scaling
 * -> `keep-ration`: scale while preserving aspect ration
 * -> `stretch`: scale without preserving aspect ration
 */
// TODO: Could be extended with 'x-stretch' and 'y-stretch'
export type ScaleMode = 'none' | 'keep-ratio' | 'stretch';

export const DEFAULT_SCALE_MODE: ScaleMode = 'none';

export type ScaleProps = {
    /**
     * Defaults to `none`
     */
    scale?: ScaleMode;
};
