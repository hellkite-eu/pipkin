import { h } from 'virtual-dom';
import { boundingBoxToPx } from './toPx';
import { BoundingBox, HyperNode } from '../types';

export const placeBoundingBox = async (box: BoundingBox): Promise<HyperNode> => {
    return h(
        'div',
        {
            style: {
                position: 'absolute',
                border: '2px solid red',
                background: 'transparent',
                boxSizing: 'border-box',
                ...boundingBoxToPx(box),
            },
        },
        [],
    );
};
