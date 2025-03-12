import { CanvasTextBaseline } from 'canvas';
import {JimpInstance, loadFont} from 'jimp';

export type ImageType = JimpInstance;

export type FontType = Awaited<ReturnType<typeof loadFont>>;

export type Point = {
   x: number;
   y: number;
};

export type LayerPosition = AlignmentProps &
   ScaleProps & {
      start: Point;
      size: Point;
   };

export type AlignmentProps = {
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

export const DEFAULT_ALIGNMENT: Alignment = 'center';

export const CANVAS_BASELINE_MAPPING: Record<Alignment, CanvasTextBaseline> = {
   'start': 'top',
   'center': 'middle',
   'end': 'bottom',
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
      size?: { px: number };
      family?: string;
      bold?: boolean;
      italic?: boolean;
   },
   color?: string,
   // TODO: font options
   // TODO: processor fn
};
