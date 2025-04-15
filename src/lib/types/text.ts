import { ReplacementMap } from './replacement';

export type TextRef<EntryType> =
    | { key: string }
    | { text: string }
    | { textFn: (entry: EntryType) => string };

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
    replacement?: ReplacementMap;

    /**
     * default `center`
     */
    xAlign?:
        | 'left'
        | 'center'
        | 'right'
        | 'justify'
        | 'justify-left'
        | 'justify-center'
        | 'justify-right';

    /**
     * default `center`
     */
    yAlign?:
        | 'left'
        | 'center'
        | 'right'
        | 'justify'
        | 'justify-left'
        | 'justify-center'
        | 'justify-right';
};

// TODO: all required
export const DEFAULT_TEXT_LAYER_OPTIONS: TextLayerOptions = {
    xAlign: 'center',
    yAlign: 'center',
};
