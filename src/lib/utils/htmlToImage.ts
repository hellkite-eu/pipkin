import { create as createElement } from 'virtual-dom';
import nodeHtmlToImage from 'node-html-to-image';
import { Jimp } from 'jimp';
import { HyperNode, ImageType, Size } from '../types';

export const htmlToImage = async (
    document: HyperNode,
    backgroundSize: Size,
): Promise<ImageType> => {
    const html = createElement(document).toString();
    const image = await nodeHtmlToImage({
        html,
        transparent: true,
        type: 'png',
        puppeteerArgs: {
            defaultViewport: {
                width: backgroundSize.width,
                height: backgroundSize.height,
            },
        },
    });
    return Jimp.read(image as Buffer) as Promise<ImageType>;
};
