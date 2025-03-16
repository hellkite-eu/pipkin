import { createCanvas } from 'canvas';
import { canvasToImage } from './canvasToImage';
import { Size } from '../types/2d';
import { BoundingBox, ImageType } from '../types/image';

export const drawBoundingBox = async (
    box: BoundingBox,
    imageSize: Size,
): Promise<ImageType> => {
    const canvas = createCanvas(imageSize.width, imageSize.height);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'red';
    ctx.strokeRect(box.start.x, box.start.y, box.size.width, box.size.height);

    return canvasToImage(canvas);
};
