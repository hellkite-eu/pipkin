import { h, VNode } from 'virtual-dom';
import { ImageType, BoundingBox, Size, TextLayerOptions } from '../types';
import { boundingBoxToPx, toPx } from './toPx';
import { htmlToImage } from './htmlToImage';
import { RequiredDeep } from 'type-fest';

export const renderText = async <EntryType extends Record<string, string>>(
    text: string,
    box: BoundingBox,
    backgroundSize: Size,
    options: RequiredDeep<TextLayerOptions<EntryType>>,
    fonts: Record<string, string>,
): Promise<ImageType> => {
    let textChildren: Array<string | VNode> = [text];
    for (const [word, image] of Object.entries(options.replacement)) {
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
                                    height: toPx(options.font.size),
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

    const content = h(
        'div',
        {
            style: {
                display: 'flex',
                overflow: 'visible',
                position: 'absolute',

                justifyContent: options.justifyContent,
                alignItems: options.alignItems,

                ...boundingBoxToPx(box),
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

                        color: options.color,
                        fontFamily: options.font.family,
                        fontSize: options.font.size,
                        fontStyle: options.font.italic ? 'italic' : undefined,
                        fontWeight: options.font.bold ? 'bold' : undefined,
                    },
                },
                textChildren,
            ),
        ],
    );

    const document = h('html', [
        h('head', [
            h(
                'style',
                Object.entries(fonts)
                    .map(
                        ([name, data]) =>
                            `@font-face {
                                font-family: '${name}';
                                src: url(data:font/ttf;base64,${data}) format('truetype');
                            }`,
                    )
                    .join('\n'),
            ),
        ]),
        h('body', [content]),
    ]);

    return htmlToImage(document, backgroundSize);
};
