import { Alignment, ImageType, ScaleMode } from './image';

export const DEFAULT_CONTAINER_OPTIONS: Required<ContainerOptions> = {
    gap: 0,
    overflow: false,
    justify: 'no-space',
    alignment: 'center',
    centering: 'center',
    scale: 'none',
};

export type ContainerOptions = {
    /**
     * Setting a non-default value for justify will cause the alignment to be ignored.
     * 
     * Defaults to `no-space`
     */
    justify?: ContainerJustify;

    /**
     * This is treated as a minimum length of an unit of space
     * between two items, but it can grow larger than it
     * 
     * Defaults to 0
     */
    gap?: number; // TODO: add other options

    /**
     * Render items that do not fit in the container outside of
     * its bounding box
     *
     * Defaults to false
     */
    overflow?: boolean;

    /**
     * Defines how the items should be placed
     * across the main direction of the container
     *
     * Defaults to `center`
     */
    alignment?: Alignment;

    /**
     * Defines how the items should be placed
     * across the secondary direction of the container
     *
     * Defaults to `center`
     */
    centering?: Alignment;

    /**
     * Defaults to `none`
     */
    scale?: ScaleMode;
};

export type DirectionContainerOptions = ContainerOptions;

/**
 * Defines how the remaining space be used
 * -> `space-evenly` - around each item is a pair of equal units of space
 * -> `space-between` - between each 2 items there is a single units of space
 * -> `space-around` - around each item is a unique pair of equal units of space
 * -> `no-space` - no space
 */
type ContainerJustify =
    | 'space-evenly'
    | 'space-between'
    | 'space-around'
    | 'no-space';

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


export type PackingFn = (background: ImageType, images: Array<ImageType>) => ImageType;
