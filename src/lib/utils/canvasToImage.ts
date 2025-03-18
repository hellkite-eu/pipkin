import { Jimp } from 'jimp';
import { ImageType } from '../types/image';
import * as fabric from 'fabric/node';

export const canvasToImage = async (canvas: fabric.Canvas): Promise<ImageType> => {
    const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
    });
    const image = await Jimp.read(
        Buffer.from(dataUrl.split(',')[1], 'base64'),
    );
    return Jimp.fromBitmap({
        data: image.bitmap.data,
        width: image.bitmap.width,
        height: image.bitmap.height
    });
};
