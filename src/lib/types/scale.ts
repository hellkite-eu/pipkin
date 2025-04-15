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
