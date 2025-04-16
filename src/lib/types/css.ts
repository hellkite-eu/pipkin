import { ScaleMode } from './scale';

export type JustifyContent =
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-evenly'
    | 'space-between'
    | 'space-around'
    | 'normal';

export type AlignItems =
    | 'normal'
    | 'stretch'
    | 'center'
    | 'start'
    | 'end'
    | 'flex-start'
    | 'flex-end'
    | 'self-start'
    | 'self-end'
    | 'baseline'
    | 'first baseline'
    | 'last baseline'
    | 'safe center'
    | 'unsafe center';

export const SCALE_MODE_TO_OBJECT_FIT: Record<ScaleMode, string> = {
    'keep-ratio': 'contain',
    stretch: 'fill',
    none: 'none',
};
