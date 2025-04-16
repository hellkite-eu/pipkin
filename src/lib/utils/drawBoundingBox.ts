import { h } from 'virtual-dom';
import { htmlToImage } from './htmlToImage';
import { boundingBoxToPx } from './toPx';
import { ImageType, Size, BoundingBox } from '../types';

export const drawBoundingBox = async (
    box: BoundingBox,
    imageSize: Size,
): Promise<ImageType> => {
    const document = h(
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

    return htmlToImage(document, imageSize);
};
