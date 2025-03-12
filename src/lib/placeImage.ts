import {Jimp} from 'jimp';
import {
   LayerPosition,
   ImageType,
   DEFAULT_ANCHOR_ALIGNMENT,
   ImageLayerOptions,
   Anchor,
   BoundingBox,
   DEFAULT_SCALE_MODE,
   AnchorAlignment,
   BoundingBoxAlignment,
   DEFAULT_BOUNDING_BOX_ALIGNMENT,
} from './types';

function computeOffsetFromAnchorAlignment(
   alignment: AnchorAlignment,
   size: number,
): number {
   if (alignment === 'after') {
      return 0;
   } else if (alignment === 'centred') {
      return Math.floor(size / 2);
   } else {
      return -size;
   }
}

function computeOffsetFromBoundingBoxAlignment(
   alignment: BoundingBoxAlignment,
   size: number,
   boxSize: number,
): number {
   if (alignment === 'start') {
      return 0;
   } else if (alignment === 'centred') {
      return Math.floor((boxSize - size) / 2);
   } else {
      return -(boxSize - size);
   }
}

function placeImageByAnchorPoint(
   bg: ImageType,
   image: ImageType,
   position: Anchor,
): ImageType {
   // handle alignment around the anchor point
   const xAlignment =
      position.xAlignment ?? position.alignment ?? DEFAULT_ANCHOR_ALIGNMENT;
   const yAlignment =
      position.yAlignment ?? position.alignment ?? DEFAULT_ANCHOR_ALIGNMENT;

   const xOffset =
      position.anchorPoint.x -
      computeOffsetFromAnchorAlignment(xAlignment, image.width);
   const yOffset =
      position.anchorPoint.y -
      computeOffsetFromAnchorAlignment(yAlignment, image.height);

   return bg.composite(image, xOffset, yOffset);
}

function placeImageByBoundingBox(
   bg: ImageType,
   image: ImageType,
   position: BoundingBox,
): ImageType {
   // handle alignment inside the bounding box
   const xAlignment =
      position.xAlignment ??
      position.alignment ??
      DEFAULT_BOUNDING_BOX_ALIGNMENT;
   const yAlignment =
      position.yAlignment ??
      position.alignment ??
      DEFAULT_BOUNDING_BOX_ALIGNMENT;

   const scale = position.scale ?? DEFAULT_SCALE_MODE;

   if (scale === 'keep-ratio') {
      // TODO: handle case when box has a size equal to 0
      const ratio = Math.min(
         position.size.x / image.width,
         position.size.y / image.height,
      );
      image.scale(ratio);
   }

   if (scale === 'stretch') {
      image.scaleToFit({w: position.size.x, h: position.size.y});
   }

   const xOffset =
      position.start.x -
      computeOffsetFromBoundingBoxAlignment(
         xAlignment,
         image.width,
         position.size.x,
      );
   const yOffset =
      position.start.y -
      computeOffsetFromBoundingBoxAlignment(
         yAlignment,
         image.height,
         position.size.y,
      );

   return bg.composite(image, xOffset, yOffset);
}

export async function placeImage(
   bg: ImageType,
   imagePath: string,
   position: LayerPosition,
   options?: ImageLayerOptions,
): Promise<ImageType> {
   const image = (await Jimp.read(imagePath)) as unknown as ImageType;

   return 'anchorPoint' in position
      ? placeImageByAnchorPoint(bg, image, position)
      : placeImageByBoundingBox(bg, image, position);
}
