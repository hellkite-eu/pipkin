import { AlignItems, JustifyContent } from './css';
import { ImageType } from './image';
import { ScaleMode } from './scale';

export type ContainerOptions = {
    /**
     * Setting a non-default value for justify will cause the alignment to be ignored.
     * 
     * Defaults to `normal`
     */
    justifyContent?: JustifyContent;

    /**
     * This is treated as a minimum length of an unit of space
     * between two items, but it can grow larger than it
     * 
     * Defaults to 0
     */
    gap?: number;

    /**
     * Defines how the items should be placed
     * across the secondary direction of the container
     *
     * Defaults to `center`
     */
    alignItems?: AlignItems;

    /**
     * Defaults to `none`
     */
    scale?: ScaleMode;
};

export const DEFAULT_CONTAINER_OPTIONS: Required<ContainerOptions> = {
    gap: 0,
    justifyContent: 'normal',
    alignItems: 'center',
    scale: 'none',
};

export type DirectionContainerOptions = ContainerOptions & {
    reversed?: boolean;
};

export const DEFAULT_DIRECTION_CONTAINER_OPTIONS: Required<DirectionContainerOptions> = {
    ...DEFAULT_CONTAINER_OPTIONS,
    reversed: false,
}

export type GridContainerOptions = ContainerOptions & {
    rows?: number;
    cols?: number;

    /**
     * Defines what is considered the main direction of the container.
     * -> `rows` - the items would be placed to fill each row before starting the next
     * -> `cols` - the items would be placed to fill each col before starting the next
     *
     * Defaults to `rows`
     */
    direction?: 'rows' | 'cols';
};


export type PackingFn = (background: ImageType, images: Array<ImageType>) => Promise<ImageType>;
