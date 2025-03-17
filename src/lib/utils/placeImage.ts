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

export async function placeImage(
    // TODO: pass background size only
    bg: ImageType,
    imagePath: string,
    position: ImagePosition,
    options?: ImageLayerOptions,
    defaultAssetsPath?: string,
): Promise<ImageType> {
    const assetsPath = options?.assetsPath ?? defaultAssetsPath;
    const imageCompletePath = assetsPath
        ? path.join(assetsPath, imagePath)
        : imagePath;
    const image = (await Jimp.read(imageCompletePath)) as unknown as ImageType;

    // handle alignment inside the bounding box
    const xAlignment =
        position.xAlignment ?? position.alignment ?? DEFAULT_IMAGE_ALIGNMENT;
    const yAlignment =
        position.yAlignment ?? position.alignment ?? DEFAULT_IMAGE_ALIGNMENT;

    const scale = position.scale ?? DEFAULT_SCALE_MODE;

    if (scale === 'keep-ratio') {
        // TODO: handle case when box has a size equal to 0
        const ratio = Math.min(
            position.size.width / image.width,
            position.size.height / image.height,
        );
        image.scale(ratio);
    }

    if (scale === 'stretch') {
        image.scaleToFit({ w: position.size.width, h: position.size.height });
    }

    const xOffset =
        position.start.x +
        computeOffsetFromAlignment(
            xAlignment,
            image.width,
            position.size.width,
        );
    const yOffset =
        position.start.y +
        computeOffsetFromAlignment(
            yAlignment,
            image.height,
            position.size.height,
        );

    return bg.composite(image, xOffset, yOffset);
}
