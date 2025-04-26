import { h } from 'virtual-dom';
import { boundingBoxToPx } from './toPx';
import {
    ImageLayerOptions,
    ImageType,
    BoundingBox,
    SCALE_MODE_TO_OBJECT_FIT,
    HyperNode,
    ImageLayerSpecificOptions,
} from '../types';
import { RequiredDeep } from 'type-fest';

type PlaceImageProps<EntryType extends Record<string, string>> = {
    image: ImageType;
    box: BoundingBox;
    options: RequiredDeep<ImageLayerOptions<EntryType>>;
};

export const placeImage = async <EntryType extends Record<string, string>>({
    image,
    box,
    options,
}: PlaceImageProps<EntryType>): Promise<HyperNode> => {
    return h(
        'div',
        {
            style: {
                display: 'flex',
                position: 'absolute',
                scale: 1,

                justifyContent: options.justifyContent,
                alignItems: options.alignItems,

                ...boundingBoxToPx(box),
            },
        },
        [await prepareImage({ image, options })],
    );
};

type PrepareImageProps<EntryType extends Record<string, string>> = {
    image: ImageType;
    options: RequiredDeep<ImageLayerSpecificOptions<EntryType>>;
};

export const prepareImage = async <EntryType extends Record<string, string>>({
    image,
    options,
}: PrepareImageProps<EntryType>): Promise<HyperNode> => {
    const imageBase64 = await image.getBase64('image/png');
    const objectFit = SCALE_MODE_TO_OBJECT_FIT[options.scale];

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
};
