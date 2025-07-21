import type { RequiredDeep } from 'type-fest';
import { DEFAULT_LAYER_OPTIONS, LayerOptions } from './layer';
import { Replacement } from '../template';

/**
 * Static text -> `text`
 * Dynamic text -> `key`, `textFn`
 */
export type TextRef<EntryType> =
    | { text: string }
    | { key: string }
    | { textFn: (entry: EntryType) => string };

export type FontOptions = {
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

export type TextLayerOptions<EntryType extends Record<string, string>> =
    LayerOptions<EntryType> & {
        font?: FontOptions;

        color?: string;

        border?: {
            width?: number;
            color?: string;
        };

        replacementFn?: (replace: Replacement) => Replacement;

        // TODO: processor fn
    };

export const DEFAULT_FONT: Required<FontOptions> = {
    size: 28,
    family: 'Arial',
    bold: false,
    italic: false,
};

export type TextLayerSpecificOptions<EntryType extends Record<string, string>> =
    Omit<TextLayerOptions<EntryType>, keyof LayerOptions<EntryType>>;

export const DEFAULT_TEXT_LAYER_OPTIONS: RequiredDeep<
    TextLayerOptions<Record<string, string>>
> = {
    ...DEFAULT_LAYER_OPTIONS,
    font: DEFAULT_FONT,
    color: 'black',
    replacementFn: replacement => replacement,
    border: {
        width: 0,
        color: 'black',
    },
};
