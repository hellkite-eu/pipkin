import { Canvas } from 'canvas';
import { Jimp } from 'jimp';
import { ImageType } from '../types/image';

export const canvasToImage = async (canvas: Canvas): Promise<ImageType> => {
    const ctx = canvas.getContext('2d');
    return Jimp.fromBitmap(ctx.getImageData(0, 0, canvas.width, canvas.height));
};
