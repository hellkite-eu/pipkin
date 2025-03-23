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
        left: box.start.x,
        top: box.start.y,
        width: box.size.width,
        height: box.size.height,
        stroke: 'red',
        strokeWidth: 2,
        fill: 'transparent',
    });
    fabricCanvas.add(boundingBox);
    return canvasToImage(fabricCanvas);
};
