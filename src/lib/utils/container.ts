import { BoundingBox, Point } from '../types/2d';
import {
    DEFAULT_CONTAINER_OPTIONS,
    DEFAULT_DIRECTION_CONTAINER_OPTIONS,
    DirectionContainerOptions,
    PackingFn,
} from '../types/containers';
import { ImageType, ScaleMode } from '../types/image';
import { h, create as createElement, VNode } from 'virtual-dom';
import nodeHtmlToImage from 'node-html-to-image';
import { Jimp } from 'jimp';
import { toPx } from '../types';

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

const directionalPackingFn = async ({
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
}): Promise<ImageType> => {
    const objectFit = SCALE_MODE_TO_OBJECT_FIT[options?.scale ?? 'none'];
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

                flexDirection: `${isVertical ? 'column' : 'row'}${options?.reversed ? '-reversed' : ''}`,
                gap: toPx(options?.gap ?? 0),
                // TODO: merge options and defaults
                justifyContent:
                    options?.justifyContent ??
                    DEFAULT_DIRECTION_CONTAINER_OPTIONS.justifyContent,
                alignItems:
                    options?.alignItems ??
                    DEFAULT_DIRECTION_CONTAINER_OPTIONS.alignItems,

                top: toPx(position.y),
                left: toPx(position.x),
                height: toPx(position.height),
                width: toPx(position.width),
            },
        },
        children,
    );

    const rootNode = createElement(document);
    // TODO: extract this in a dif function
    const image = await nodeHtmlToImage({
        html: rootNode.toString(),
        transparent: true,
        type: 'png',
        puppeteerArgs: {
            defaultViewport: {
                width: background.width,
                height: background.height,
            },
        },
    });
    return Jimp.read(image as Buffer) as Promise<ImageType>;
};


const SCALE_MODE_TO_OBJECT_FIT: Record<ScaleMode, string> = {
    'keep-ratio': 'contain',
    stretch: 'fill',
    none: 'none',
};
