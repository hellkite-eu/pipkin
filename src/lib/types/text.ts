import { CanvasTextAlign, CanvasTextBaseline } from 'canvas';
import { Point } from './2d';

export type TextLayerOptions = {
    font?: {
        /**
         * Size of font is represented in pixels
         */
        size?: number;
        /**
         * Either use one supported by canvas
         * or load a custom one before rendering
         */
        family?: string;
        /**
         * Warning: Not supported by all fonts
         */
        bold?: boolean;
        /**
         * Warning: Not supported by all fonts
         */
        italic?: boolean;
    };
    color?: string;
    // TODO: processor fn
};

export type TextPosition = TextAlignmentProps &
    Anchor & {
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
};

export type Anchor = {
    anchor: Point;
};
