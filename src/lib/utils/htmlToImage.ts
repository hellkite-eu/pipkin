import { create as createElement, VNode } from 'virtual-dom';
import nodeHtmlToImage from 'node-html-to-image';
import { Jimp } from 'jimp';
import { ImageType, Size } from '../types';

export const htmlToImage = async (
    document: VNode,
    backgroundSize: Size,
): Promise<ImageType> => {
    const html = createElement(document).toString();
    // TODO: extract this in a dif function
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
