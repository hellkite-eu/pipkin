import { h, create as createElement, VNode } from 'virtual-dom';
import {
    DEFAULT_TEXT_LAYER_OPTIONS,
    ImageType,
    Size,
    TextLayerOptions,
    TextPosition,
    toPx,
} from '../types';
import nodeHtmlToImage from 'node-html-to-image';
import { Jimp } from 'jimp';


export const renderText = async (
    text: string,
    position: TextPosition,
    backgroundSize: Size,
    options?: TextLayerOptions,
): Promise<ImageType> => {
    let textChildren: Array<string | VNode> = [text];
    for (const [word, image] of Object.entries(options?.replacement ?? {})) {
        const regex = new RegExp(word, 'gi');
        const imageBase64 = await image.getBase64('image/png');

        let tmpChildren: Array<string | VNode> = [];
        for (const textSegment of textChildren) {
            if (typeof textSegment !== 'string') {
                continue;
            }

            const parts = (textSegment as string).split(regex);
            for (let index = 0; index < parts.length; index++) {
                if (index > 0) {
                    tmpChildren.push(
                        h(
                            'img',
                            {
                                style: {
                                    display: 'inline',
                                    verticalAlign: 'middle',
                                    height: toPx(options?.font?.size ?? 28), // TODO: use constant
                                    width: 'auto',
                                },
                                src: imageBase64,
                            },
                            [],
                        ),
                    );
                }
                tmpChildren.push(parts[index]);
            }
        }

        textChildren = tmpChildren;
    }

    const document = h(
        'div',
        {
            style: {
                display: 'flex',
                overflow: 'visible',
                position: 'absolute',

                top: toPx(position.y),
                left: toPx(position.x),
                height: toPx(position.height),
                width: toPx(position.width),

                justifyContent:
                    options?.xAlign ?? DEFAULT_TEXT_LAYER_OPTIONS.xAlign,
                alignItems:
                    options?.yAlign ?? DEFAULT_TEXT_LAYER_OPTIONS.yAlign,
            },
        },
        [
            h(
                'div',
                {
                    style: {
                        overflow: 'visible',
                        overflowWrap: 'word-wrap',
                        whiteSpace: 'normal',

                        color: options?.color,
                        fontFamily: options?.font?.family,
                        fontSize: options?.font?.size,
                        fontStyle: options?.font?.italic ? 'italic' : undefined,
                        fontWeight: options?.font?.bold ? 'bold' : undefined,
                    },
                },
                textChildren,
            ),
        ],
    );

    const rootNode = createElement(document);
    const image = await nodeHtmlToImage({
        html: rootNode.toString(),
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
