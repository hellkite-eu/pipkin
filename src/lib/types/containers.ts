import { RequiredDeep } from 'type-fest';
import { BoundingBox } from './boundingBox';
import { ImageLayerSpecificOptions, ImageRef, ImageType } from './image';
import { ScaleMode } from './scale';
import { LayerOptions } from './layer';
import { HyperNode } from './hypernode';
import { TextLayerSpecificOptions, TextRef } from './text';

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

export type ElementRef<EntryType extends Record<string, string>> =
    | {
          image: ImageRef<EntryType>;
          options?: ImageLayerSpecificOptions<EntryType>;
      }
    | {
          text: TextRef<EntryType>;
          options?: TextLayerSpecificOptions<EntryType>;
      }
    | {
          node: HyperNode;
      };

export type ElementsFn = <EntryType extends Record<string, string>>(
    entry: EntryType,
) => Promise<Array<ElementRef<EntryType>>>;

export type PackingFn = (
    box: BoundingBox,
    elements: Array<HyperNode>,
) => Promise<HyperNode>;
