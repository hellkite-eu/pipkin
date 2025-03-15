import {CanvasTextAlign, CanvasTextBaseline} from 'canvas';
import {JimpInstance, loadFont} from 'jimp';

export type ImageType = JimpInstance;

export type FontType = Awaited<ReturnType<typeof loadFont>>;

export type Point = {
   x: number;
   y: number;
};

export type Size = {
   width: number;
   height: number;
};

/**
 * IMAGE
 */

export type ImagePosition = ImageAlignmentProps & ScaleProps & BoundingBox;

export type BoundingBox = {
   start: Point;
   size: Size;
};

export type Anchor = {
   anchor: Point;
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
 * TEXT
 */
export type TextPosition = TextAlignmentProps & ScaleProps & Anchor & {
   maxWidth?: number;
};

export type TextAlignmentProps = {
   /**
    * default `center`
    */
   alignment?: CanvasTextAlign;
   /**
    * default `center`
    */
   baseline?: CanvasTextBaseline;
};

export const DEFAULT_TEXT_ALIGNMENT_PROPS: Required<TextAlignmentProps> = {
   alignment: 'center',
   baseline: 'top',
}

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

export const toSize = (w: number, h: number): Size => ({width: w, height: h});

export type TemplateOptions = {
   height: number;
   width: number;
   color?: number;
};

export type ImageLayerOptions = {
   assetsPath?: string;
   // TODO: processor fn
};

export type TextLayerOptions = {
   font?: {
      // TODO: maybe add other sizes too
      size?: {px: number};
      family?: string;
      bold?: boolean;
      italic?: boolean;
   };
   color?: string;
   // TODO: font options
   // TODO: processor fn
};
