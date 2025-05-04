import { PDFDocument } from 'pdf-lib';
import { ImageType, PDFData } from '../types';

export const imagesToPdf = async (images: Array<ImageType>): Promise<PDFData> => {
  const pdf = await PDFDocument.create();

  for (const image of images) {
    const imageBase64 = await image.getBase64('image/png');
    const embeddedImage = await pdf.embedPng(imageBase64);
    const { width, height } = embeddedImage.scale(1);
    const page = pdf.addPage([width, height]);

    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return pdf.save();
}
