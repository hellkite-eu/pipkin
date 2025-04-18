import { h } from 'virtual-dom';
import { boundingBoxToPx } from './toPx';
import {
    ImageLayerOptions,
    ImageType,
    BoundingBox,
    SCALE_MODE_TO_OBJECT_FIT,
} from '../types';
import { htmlToImage } from './htmlToImage';
import { RequiredDeep } from 'type-fest';

type PlaceImageProps<EntryType extends Record<string, string>> = {
    image: ImageType;
    box: BoundingBox;
    backgroundSize: { width: number; height: number };
    options: RequiredDeep<ImageLayerOptions<EntryType>>;
};

export const placeImage = async <EntryType extends Record<string, string>>({
    image,
    box,
    backgroundSize,
    options,
}: PlaceImageProps<EntryType>): Promise<ImageType> => {
    const imageBase64 = await image.getBase64('image/png');
    const objectFit = SCALE_MODE_TO_OBJECT_FIT[options.scale];

    const document = h(
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
