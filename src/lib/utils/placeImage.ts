import { Jimp } from 'jimp';
import path from 'path';
import {
    ImageAlignment,
    ImageType,
    ImagePosition,
    ImageLayerOptions,
    DEFAULT_IMAGE_ALIGNMENT,
    DEFAULT_SCALE_MODE,
} from '../types/image';

function computeOffsetFromAlignment(
    alignment: ImageAlignment,
    size: number,
    boxSize: number,
): number {
    if (alignment === 'start') {
        return 0;
    } else if (alignment === 'center') {
        return Math.floor((boxSize - size) / 2);
    } else {
        return -(boxSize - size);
    }
}

type PlaceImageProps = {
    background: ImageType;
    image: ImageType;
    position: ImagePosition;
};

export async function placeImage(
    // TODO: pass background size only
    { background, image, position }: PlaceImageProps,
): Promise<ImageType> {
    // handle alignment inside the bounding box
    const xAlignment =
        position.xAlignment ?? position.alignment ?? DEFAULT_IMAGE_ALIGNMENT;
    const yAlignment =
        position.yAlignment ?? position.alignment ?? DEFAULT_IMAGE_ALIGNMENT;

    const scale = position.scale ?? DEFAULT_SCALE_MODE;

    if (scale === 'keep-ratio') {
        // TODO: handle case when box has a size equal to 0
        const ratio = Math.min(
            position.width / image.width,
            position.height / image.height,
        );
        image.scale(ratio);
    }

    if (scale === 'stretch') {
        image.scaleToFit({ w: position.width, h: position.height });
    }

    const xOffset =
        position.x +
        computeOffsetFromAlignment(xAlignment, image.width, position.width);
    const yOffset =
        position.y +
        computeOffsetFromAlignment(yAlignment, image.height, position.height);

    return background.composite(image, xOffset, yOffset);
}
