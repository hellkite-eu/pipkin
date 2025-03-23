import { canvasToImage } from './canvasToImage';
import { Size } from '../types/2d';
import { BoundingBox, ImageType } from '../types/image';
import * as fabric from 'fabric/node';

export const drawBoundingBox = async (
    box: BoundingBox,
    imageSize: Size,
): Promise<ImageType> => {
    const fabricCanvas = new fabric.Canvas(undefined, imageSize);
    const boundingBox = new fabric.Rect({
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        stroke: 'red',
        strokeWidth: 2,
        fill: 'transparent',
    });
    fabricCanvas.add(boundingBox);
    return canvasToImage(fabricCanvas);
};
