import { h } from 'virtual-dom';
import {
    DEFAULT_DIRECTION_CONTAINER_OPTIONS,
    DirectionContainerOptions,
    PackingFn,
    BoundingBox,
    GridContainerOptions,
    DEFAULT_GRID_CONTAINER_OPTIONS,
    HyperNode,
} from '../types';
import { boundingBoxToPx, toPx } from './toPx';
import merge from 'lodash.merge';
import chunk from 'lodash.chunk';

export const vboxPackingFn =
    <EntryType extends Record<string, string>>(
        options?: DirectionContainerOptions<EntryType>,
    ): PackingFn =>
    (box: BoundingBox, elements: Array<HyperNode>) =>
        directionalPackingFn({
            isVertical: true,
            elements,
            box,
            options,
        });

export const hboxPackingFn =
    <EntryType extends Record<string, string>>(
        options?: DirectionContainerOptions<EntryType>,
    ): PackingFn =>
    (box: BoundingBox, elements: Array<HyperNode>) =>
        directionalPackingFn({
            isVertical: false,
            elements,
            box,
            options,
        });

export const gridPackingFn =
    <EntryType extends Record<string, string>>(
        options?: GridContainerOptions<EntryType>,
    ): PackingFn =>
    async (box: BoundingBox, elements: Array<HyperNode>) => {
        const mergedOptions = merge(
            {},
            DEFAULT_GRID_CONTAINER_OPTIONS,
            options,
        );

        const items = [];
        for (const subset of chunk(elements)) {
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
        return h(
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
    };

const directionalPackingFn = async <EntryType extends Record<string, string>>({
    isVertical,
    elements,
    box,
    options,
}: {
    isVertical: boolean;
    elements: Array<HyperNode>;
    box: BoundingBox;
    options?: DirectionContainerOptions<EntryType>;
}): Promise<HyperNode> => {
    const mergedOptions = merge(
        {},
        DEFAULT_DIRECTION_CONTAINER_OPTIONS,
        options,
    );

    return h(
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
        elements,
    );
};
