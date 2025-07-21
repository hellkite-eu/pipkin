import { h } from 'virtual-dom';
import { boundingBoxToPx } from './toPx';
import { BoundingBox, HyperNode } from '../types';
import { reduceBoundingBox } from './reduceBoundingBox';

export const placeBoundingBox = async (
    box: BoundingBox,
): Promise<HyperNode> => {
    const borderWidthPx = 2;
    const reducedBoundingBox = reduceBoundingBox(box, borderWidthPx);
    return h('div', {}, [
        h(
            'div',
            {
                style: {
                    position: 'absolute',
                    border: `${borderWidthPx}px solid red`,
                    background: 'transparent',
                    boxSizing: 'border-box',
                    ...boundingBoxToPx(box),
                },
            },
            [],
        ),
        h(
            'div',
            {
                style: {
                    position: 'absolute',
                    border: `${borderWidthPx}px dashed blue`,
                    background: 'transparent',
                    boxSizing: 'border-box',
                    ...boundingBoxToPx(reducedBoundingBox),
                },
            },
            [],
        ),
    ]);
};
