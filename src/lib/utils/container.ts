import { BoundingBox, Point } from '../types/2d';
import {
    DEFAULT_CONTAINER_OPTIONS,
    DirectionContainerOptions,
    PackingFn,
} from '../types/containers';
import { ImageType } from '../types/image';

export const vboxPackingFn =
    (position: BoundingBox, options?: DirectionContainerOptions): PackingFn =>
    (background: ImageType, images: Array<ImageType>) =>
        directionalPackingFn({
            isVertical: true,
            background,
            images,
            position,
            options,
        });

export const hboxPackingFn =
    (position: BoundingBox, options?: DirectionContainerOptions): PackingFn =>
    (background: ImageType, images: Array<ImageType>) =>
        directionalPackingFn({
            isVertical: false,
            background,
            images,
            position,
            options,
        });

const directionalPackingFn = ({
    isVertical,
    background,
    images,
    position,
    options,
}: {
    isVertical: boolean;
    background: ImageType;
    images: Array<ImageType>;
    position: BoundingBox;
    options?: DirectionContainerOptions;
}): ImageType => {
    const imagesToRender = computeImagesToRender(
        isVertical,
        images,
        position,
        options,
    );
    const renderingCoordinates = computeRenderCoordinatesForImages(
        isVertical,
        imagesToRender,
        position,
        options,
    );
    for (
        let index = 0;
        index < Math.min(imagesToRender.length, renderingCoordinates.length);
        index++
    ) {
        const image = imagesToRender[index];
        const coordinate = renderingCoordinates[index];

        background.composite(image, coordinate.x, coordinate.y);
    }
    return background;
};

const mainCoordinateFn = (
    item: { x: number; y: number },
    isVertical: boolean,
): number => (isVertical ? item.y : item.x);

const secondaryCoordinateFn = (
    item: { x: number; y: number },
    isVertical: boolean,
): number => mainCoordinateFn(item, !isVertical);

const mainSizeFn = (
    item: { width: number; height: number },
    isVertical: boolean,
): number => (isVertical ? item.height : item.width);

const secondarySizeFn = (
    item: { width: number; height: number },
    isVertical: boolean,
): number => mainSizeFn(item, !isVertical);

const computeImagesToRender = (
    isVertical: boolean,
    images: Array<ImageType>,
    position: BoundingBox,
    options?: DirectionContainerOptions,
): Array<ImageType> => {
    const gap = options?.gap ?? DEFAULT_CONTAINER_OPTIONS.gap;

    const scale = options?.scale ?? DEFAULT_CONTAINER_OPTIONS.scale;
    if (scale !== 'none') {
        // TODO: if there are too many gaps, there might still be overflow
        // TODO: scale images
        return images;
    }

    const totalSize =
        images.reduce((acc, image) => acc + mainSizeFn(image, isVertical), 0) +
        (images.length - 1) * gap;

    const shouldOverflow =
        options?.overflow ?? DEFAULT_CONTAINER_OPTIONS.overflow;
    const isOverflowing =
        totalSize > mainSizeFn(position, isVertical) && shouldOverflow;

    if (!isOverflowing) {
        return images;
    }
    // TODO: if scaling is enabled, return all scaled down (or up)
    const imagesToRender: Array<ImageType> = [];
    let currentSize: number = 0;
    for (const image of images) {
        if (
            currentSize + mainSizeFn(image, isVertical) + gap >
            mainSizeFn(position, isVertical)
        ) {
            return imagesToRender;
        }
        imagesToRender.push(image);
        currentSize += mainSizeFn(image, isVertical) + gap;
    }
    return imagesToRender;
};

const computeRenderCoordinatesForImages = (
    isVertical: boolean,
    images: Array<ImageType>,
    position: BoundingBox,
    options?: DirectionContainerOptions,
): Array<Point> => {
    const justify = options?.justify ?? DEFAULT_CONTAINER_OPTIONS.justify;
    const alignment = options?.alignment ?? DEFAULT_CONTAINER_OPTIONS.alignment;
    const centering = options?.centering ?? DEFAULT_CONTAINER_OPTIONS.centering;
    const gap = options?.gap ?? DEFAULT_CONTAINER_OPTIONS.gap;

    // TODO: move main coordinate computation to its own function
    // justify?: ContainerJustify;
    if (justify !== 'no-space') {
        // TODO: handle this without alignment
    }

    // compute main axis coordinates
    const mainCoordinatesInBoundingBox: Array<number> = [];
    let currentMainCoordinate = 0;
    for (const image of images) {
        mainCoordinatesInBoundingBox.push(currentMainCoordinate);
        currentMainCoordinate += mainSizeFn(image, isVertical) + gap;
    }
    const totalMainSize = Math.max(currentMainCoordinate - gap, 0);

    let mainCoordinateOffset = mainCoordinateFn(position, isVertical);
    if (alignment === 'center') {
        mainCoordinateOffset +=
            (mainSizeFn(position, isVertical) - totalMainSize) / 2;
    } else if (alignment === 'end') {
        mainCoordinateOffset +=
            mainSizeFn(position, isVertical) - totalMainSize;
    }

    const mainCoordinates = mainCoordinatesInBoundingBox.map(
        coordinate => coordinate + mainCoordinateOffset,
    );

    // compute secondary axis coordinates
    const secondaryCoordinates: Array<number> = [];
    for (const image of images) {
        const secondarySize = secondarySizeFn(image, isVertical);

        let secondaryCoordinateOffset = secondaryCoordinateFn(
            position,
            isVertical,
        );
        if (centering === 'center') {
            secondaryCoordinateOffset +=
                (secondarySizeFn(position, isVertical) - secondarySize) / 2;
        } else if (centering === 'end') {
            secondaryCoordinateOffset +=
                secondarySizeFn(position, isVertical) - secondarySize;
        }

        secondaryCoordinates.push(secondaryCoordinateOffset);
    }

    // compute rendering coordinates for each image
    const coordinates: Array<Point> = [];
    for (
        let index = 0;
        index < Math.min(mainCoordinates.length, secondaryCoordinates.length);
        index++
    ) {
        coordinates.push(
            isVertical
                ? { y: mainCoordinates[index], x: secondaryCoordinates[index]}
                : { y: secondaryCoordinates[index], x: mainCoordinates[index]}
        );
    }
    return coordinates;
};
