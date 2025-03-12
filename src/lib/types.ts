import {JimpInstance} from 'jimp';

export type ImageType = JimpInstance;

export type Point = {
   x: number;
   y: number;
};

export type LayerPosition = Anchor | BoundingBox;

export type AnchorAlignment = 'after' | 'centred' | 'before';

export const DEFAULT_ANCHOR_ALIGNMENT: AnchorAlignment = 'after';

export type BoundingBoxAlignment = 'start' | 'centred' | 'end';

export const DEFAULT_BOUNDING_BOX_ALIGNMENT: BoundingBoxAlignment = 'start';

export type AlignmentProps<AlignmentType> = {
   /**
    * Overridden by xAlignment and/or yAlignment if provided.
    * default `after`
    */
   alignment?: AlignmentType;
   /**
    * default `after`
    */
   xAlignment?: AlignmentType;
   /**
    * default `after`
    */
   yAlignment?: AlignmentType;
};

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

export const toPoint = (x: number, y: number): Point => ({x, y});

export type Anchor = AlignmentProps<AnchorAlignment> & {
   anchorPoint: Point;
};

export type BoundingBox = AlignmentProps<BoundingBoxAlignment> &
   ScaleProps & {
      start: Point;
      size: Point;
   };

export type TemplateOptions = {
   height: number;
   width: number;
};

export type ImageLayerOptions = {
   assetsPath?: string;
   // TODO: processor fn
};

export type TextLayerOptions = {
   // TODO: font options
   // TODO: processor fn
};
