import { h } from 'virtual-dom';
import { boundingBoxToPx } from './toPx';
import {
    DEFAULT_IMAGE_LAYER_OPTIONS,
    ImageLayerOptions,
    ImageType,
    BoundingBox,
    SCALE_MODE_TO_OBJECT_FIT,
} from '../types';
import merge from 'lodash.merge';
import { htmlToImage } from './htmlToImage';

type PlaceImageProps = {
    image: ImageType;
    box: BoundingBox;
    backgroundSize: { width: number; height: number };
    options: ImageLayerOptions;
};

export async function placeImage({
    image,
    box,
    backgroundSize,
    options,
}: PlaceImageProps): Promise<ImageType> {
    const imageBase64 = await image.getBase64('image/png');
    const mergedOptions = merge(DEFAULT_IMAGE_LAYER_OPTIONS, options);
    const objectFit = SCALE_MODE_TO_OBJECT_FIT[mergedOptions.scale];

    const document = h(
        'div',
        {
            style: {
                display: 'flex',
                position: 'absolute',
                scale: 1,

                justifyContent: mergedOptions.justifyContent,
                alignItems: mergedOptions.alignItems,

                ...boundingBoxToPx(box),
            },
        },
        [
            h(
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
            ),
        ],
    );

    return htmlToImage(document, backgroundSize);
}
