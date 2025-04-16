import { h } from 'virtual-dom';
import { boundingBoxToPx } from './toPx';
import {
    DEFAULT_IMAGE_LAYER_OPTIONS,
    ImageLayerOptions,
    ImageType,
    Position,
} from '../types';
import merge from 'lodash.merge';
import { SCALE_MODE_TO_OBJECT_FIT } from '../types/css';
import { vNodeToImage } from './vNodeToImage';

type PlaceImageProps = {
    image: ImageType;
    position: Position;
    backgroundSize: { width: number; height: number };
    options: ImageLayerOptions;
};

export async function placeImage({
    image,
    position,
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

                ...boundingBoxToPx(position),
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

    return vNodeToImage(document, backgroundSize);
}
