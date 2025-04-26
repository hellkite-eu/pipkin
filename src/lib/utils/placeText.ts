import { h } from 'virtual-dom';
import {
    BoundingBox,
    TextLayerOptions,
    HyperNode,
    TextLayerSpecificOptions,
} from '../types';
import { boundingBoxToPx, toPx } from './toPx';
import { RequiredDeep } from 'type-fest';

type PlaceTextProps<EntryType extends Record<string, string>> = {
    text: string;
    box: BoundingBox;
    options: RequiredDeep<TextLayerOptions<EntryType>>;
};

export const placeText = async <EntryType extends Record<string, string>>({
    text,
    box,
    options,
}: PlaceTextProps<EntryType>): Promise<HyperNode> => {
    return h(
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
            await prepareText({
                text,
                options,
            }),
        ],
    );
};

type PrepareTextProps<EntryType extends Record<string, string>> = {
    text: string;
    options: RequiredDeep<TextLayerSpecificOptions<EntryType>>;
};

export const prepareText = async <EntryType extends Record<string, string>>({
    text,
    options,
}: PrepareTextProps<EntryType>): Promise<HyperNode> => {
    let textChildren: Array<string | HyperNode> = [text];
    for (const [word, image] of Object.entries(options.replacement)) {
        const regex = new RegExp(word, 'gi');
        const imageBase64 = await image.getBase64('image/png');

        let tmpChildren: Array<string | HyperNode> = [];
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

    return h(
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

                '-webkit-text-stroke': `${options.border.width}px ${options.border.color}`,
            },
        },
        textChildren,
    );
};
