import { h } from 'virtual-dom';
import {
    DEFAULT_DIRECTION_CONTAINER_OPTIONS,
    DirectionContainerOptions,
    ImageType,
    PackingFn,
    BoundingBox,
    SCALE_MODE_TO_OBJECT_FIT,
    Size,
    GridContainerOptions,
    DEFAULT_GRID_CONTAINER_OPTIONS,
} from '../types';
import { boundingBoxToPx, toPx } from './toPx';
import merge from 'lodash.merge';
import { htmlToImage } from './htmlToImage';
import chunk from 'lodash.chunk';

export const vboxPackingFn =
    (options?: DirectionContainerOptions): PackingFn =>
    (box: BoundingBox, background: ImageType, images: Array<ImageType>) =>
        directionalPackingFn({
            isVertical: true,
            backgroundSize: background,
            images,
            box,
            options,
        });

export const hboxPackingFn =
    (options?: DirectionContainerOptions): PackingFn =>
    (box: BoundingBox, background: ImageType, images: Array<ImageType>) =>
        directionalPackingFn({
            isVertical: false,
            backgroundSize: background,
            images,
            box,
            options,
        });

export const gridPackingFn =
    (options?: GridContainerOptions): PackingFn =>
    async (
        box: BoundingBox,
        background: ImageType,
        images: Array<ImageType>,
    ) => {
        const mergedOptions = merge(DEFAULT_GRID_CONTAINER_OPTIONS, options);
        const objectFit = SCALE_MODE_TO_OBJECT_FIT[mergedOptions.scale];

        const children = await Promise.all(
            images.map(async image => {
                const imageBase64 = await image.getBase64('image/png');
                return h(
                    'img',
                    {
                        style: {
                            objectFit,
                            flex: '1 1 auto',
                            minWidth: 0,
                            minHeight: 0,
                            maxWidth: '100%',
                            maxHeight: '100%',
                        },
                        src: imageBase64,
                    },
                    [],
                );
            }),
        );

        const items = [];
        for (const subset of chunk(children)) {
            items.push(
                h(
                    'div',
                    {
                        style: {
                            display: 'flex',
                            flexDirection: 'row',
                            overflow: 'hidden',

                            gap: toPx(mergedOptions.gap),
                            justifyContent: mergedOptions.justifyContent,
                            alignItems: mergedOptions.alignItems,
                        },
                    },
                    subset,
                ),
            );
        }
        const document = h(
            'div',
            {
                style: {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${mergedOptions.size}, 1fr)`,
                    position: 'absolute',

                    gap: toPx(mergedOptions.gap),
                    ...boundingBoxToPx(box),
                },
            },
            items,
        );

        return htmlToImage(document, background);
    };

const directionalPackingFn = async ({
    isVertical,
    backgroundSize: background,
    images,
    box,
    options,
}: {
    isVertical: boolean;
    backgroundSize: Size;
    images: Array<ImageType>;
    box: BoundingBox;
    options?: DirectionContainerOptions;
}): Promise<ImageType> => {
    const mergedOptions = merge(DEFAULT_DIRECTION_CONTAINER_OPTIONS, options);
    const objectFit = SCALE_MODE_TO_OBJECT_FIT[mergedOptions.scale];

    const children = await Promise.all(
        images.map(async image => {
            const imageBase64 = await image.getBase64('image/png');
            return h(
                'img',
                {
                    style: {
                        objectFit,
                        flex: '1 1 auto',
                        minWidth: 0,
                        minHeight: 0,
                        maxWidth: '100%',
                        maxHeight: '100%',
                    },
                    src: imageBase64,
                },
                [],
            );
        }),
    );
    const document = h(
        'div',
        {
            style: {
                display: 'flex',
                position: 'absolute',
                scale: 1,

                flexDirection: `${isVertical ? 'column' : 'row'}${mergedOptions.reversed ? '-reversed' : ''}`,
                gap: toPx(mergedOptions.gap),
                justifyContent: mergedOptions.justifyContent,
                alignItems: mergedOptions.alignItems,

                ...boundingBoxToPx(box),
            },
        },
        children,
    );

    return htmlToImage(document, background);
};
