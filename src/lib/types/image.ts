import { JimpInstance } from 'jimp';
import { Point, Size } from './2d';

export type ImageType = JimpInstance;

export type ImageLayerOptions = {
    assetsPath?: string;
    // TODO: processor fn
};

export type ImagePosition = ImageAlignmentProps & ScaleProps & BoundingBox;

export type BoundingBox = {
    start: Point;
    size: Size;
};

export type ImageAlignmentProps = {
    /**
     * Overridden by xAlignment and/or yAlignment if provided.
     * default `center`
     */
    alignment?: ImageAlignment;
    /**
     * default `center`
     */
    xAlignment?: ImageAlignment;
    /**
     * default `center`
     */
    yAlignment?: ImageAlignment;
};

export type ImageAlignment = 'start' | 'center' | 'end';

export const DEFAULT_IMAGE_ALIGNMENT: ImageAlignment = 'center';

/**
 * Could be extended with 'x-stretch' and 'y-stretch'
 */
export type ScaleMode = 'none' | 'keep-ratio' | 'stretch';

export const DEFAULT_SCALE_MODE: ScaleMode = 'none';

export type ScaleProps = {
    /**
     * Behavior of the content around a space
     * that is bigger or smaller than necessary
     * - `none`: no scaling
     * - `keep-ration`: scale while preserving aspect ration
     * - `stretch`: scale without preserving aspect ration
     */
    scale?: ScaleMode;
};
