import { RequiredDeep } from 'type-fest';
import { BoundingBox } from './boundingBox';
import { ImageType } from './image';
import { ScaleMode } from './scale';
import { LayerOptions } from './layer';

export type ContainerOptions<EntryType extends Record<string, string>> =
    LayerOptions<EntryType> & {
        /**
         * This is treated as a minimum length of an unit of space
         * between two items, but it can grow larger than it
         *
         * Defaults to 0
         */
        gap?: number;

        /**
         * Defaults to `none`
         */
        scale?: ScaleMode;
    };

export const DEFAULT_CONTAINER_OPTIONS: RequiredDeep<
    ContainerOptions<Record<string, string>>
> = {
    gap: 0,
    justifyContent: 'normal',
    alignItems: 'center',
    scale: 'none',
    skip: false,
};

export type DirectionContainerOptions<
    EntryType extends Record<string, string>,
> = ContainerOptions<EntryType> & {
    reversed?: boolean;
};

export const DEFAULT_DIRECTION_CONTAINER_OPTIONS: RequiredDeep<
    DirectionContainerOptions<Record<string, string>>
> = {
    ...DEFAULT_CONTAINER_OPTIONS,
    reversed: false,
};

export type GridContainerOptions<EntryType extends Record<string, string>> =
    ContainerOptions<EntryType> & {
        size?: number;

        /**
         * Defines what is considered the main direction of the container.
         * -> `rows` - the items would be placed to fill each row before starting the next
         * -> `cols` - the items would be placed to fill each col before starting the next
         *
         * Defaults to `rows`
         */
        direction?: 'rows' | 'cols';
    };

export const DEFAULT_GRID_CONTAINER_OPTIONS: RequiredDeep<
    GridContainerOptions<Record<string, string>>
> = {
    ...DEFAULT_CONTAINER_OPTIONS,
    size: 3,
    direction: 'rows',
};

export type PackingFn = (
    box: BoundingBox,
    background: ImageType,
    images: Array<ImageType>,
) => Promise<ImageType>;
