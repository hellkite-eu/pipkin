import type { RequiredDeep } from 'type-fest';
import { LayerOptions } from './layer';
import { ReplacementMap } from './replacement';

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

        // TODO: processor fn
        replacement?: ReplacementMap;
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
    justifyContent: 'center',
    alignItems: 'center',
    font: DEFAULT_FONT,
    color: 'black',
    replacement: {},
    skip: false,
    border: {
        width: 0,
        color: 'black',
    },
};
