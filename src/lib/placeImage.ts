import {Jimp} from 'jimp';
import {
   LayerPosition,
   ImageType,
   ImageLayerOptions,
   DEFAULT_SCALE_MODE,
   Alignment,
   DEFAULT_ALIGNMENT,
} from './types';

function computeOffsetFromAlignment(
   alignment: Alignment,
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
   position: LayerPosition,
   options?: ImageLayerOptions,
): Promise<ImageType> {
   const image = (await Jimp.read(imagePath)) as unknown as ImageType;

   // handle alignment inside the bounding box
   const xAlignment =
      position.xAlignment ?? position.alignment ?? DEFAULT_ALIGNMENT;
   const yAlignment =
      position.yAlignment ?? position.alignment ?? DEFAULT_ALIGNMENT;

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
      image.scaleToFit({w: position.size.width, h: position.size.height});
   }

   // TODO: debug mode -- render bounding boxes
   const xOffset =
      position.start.x +
      computeOffsetFromAlignment(xAlignment, image.width, position.size.width);
   const yOffset =
      position.start.y +
      computeOffsetFromAlignment(yAlignment, image.height, position.size.height);

   return bg.composite(image, xOffset, yOffset);
}
