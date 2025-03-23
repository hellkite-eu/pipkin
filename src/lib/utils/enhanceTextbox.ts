import * as fabric from 'fabric/node';
import { canvasToImage } from './canvasToImage';
import { Point } from '../types/2d';
import {
    TextPosition,
    TextLayerOptions,
    DEFAULT_TEXT_ALIGNMENT_PROPS,
} from '../types/text';

const SPECIAL_STRING = '\u2000\u2000';

const replaceSubstrings = (
    text: string,
    phrases: Array<string>,
): {
    replacedText: string;
    apparitions: Array<{
        phrase: string;
        index: number;
    }>;
} => {
    if (!phrases.length) {
        return {
            replacedText: text,
            apparitions: [],
        };
    }
    const regex = new RegExp(phrases.join('|'), 'g'); // Create regex dynamically
    const apparitionsInOrder = [...text.matchAll(regex)]
        .sort((e1, e2) => e1.index - e2.index)
        .map(e => e[0]);
    const replacedText = text.replaceAll(regex, SPECIAL_STRING);
    const apparitionIndexes = [
        ...replacedText.matchAll(new RegExp(SPECIAL_STRING, 'g')),
    ]
        .map(e => e.index)
        .sort();

    // TODO: error on different lengths
    const apparitions = [];
    for (
        let index = 0;
        index < Math.min(apparitionsInOrder.length, apparitionIndexes.length);
        index++
    ) {
        apparitions.push({
            phrase: apparitionsInOrder[index],
            index: apparitionIndexes[index],
        });
    }
    return {
        replacedText,
        apparitions,
    };
};

const findCharCoordinatesInTextbox = (
    textbox: fabric.Textbox,
    charIndex: number,
): Point => {
    const { lineIndex, charIndex: lineCharIndex } =
        textbox.get2DCursorLocation(charIndex);

    // TODO: this is a very hackish approach and could be prone to errors
    const offsetX =
        textbox.left! + // textbox specific
        textbox._getLineLeftOffset(lineIndex) + // line specific
        lineCharIndex * 3 / 8 * (textbox.fontSize! + 0.1) + // no freaking idea
        textbox.fontSize! / 8; // general adjustment
    const offsetY =
        textbox.top! +
        // add height of each previous line
        Array.from({ length: lineIndex }).reduce(
            (acc: number, _, i) => acc + textbox.getHeightOfLine(i),
            0,
        );

    return {
        x: offsetX,
        y: offsetY,
    };
};

export const enhanceTextbox = async (
    text: string,
    canvas: fabric.Canvas,
    fontFamily: string,
    debugMode: boolean,
    position: TextPosition,
    options?: TextLayerOptions,
) => {
    const { replacedText, apparitions } = replaceSubstrings(
        text,
        Object.keys(options?.replacement ?? {}),
    );

    // render text
    const textbox = new fabric.Textbox(replacedText, {
        left: position.start.x,
        top: position.start.y,
        width: position.size.width,
        height: position.size.height,
        fontSize: options?.font?.size ?? 16,
        fontFamily,
        fontWeight: options?.font?.bold ? 'bold' : 'normal',
        fontStyle: options?.font?.italic ? 'italic' : 'normal',
        fill: options?.color ?? 'black',
        textAlign: position.textAlign ?? DEFAULT_TEXT_ALIGNMENT_PROPS.textAlign,
        styles: {},
    });
    canvas.add(textbox);

    // debug mode
    if (debugMode) {
        const boundingBox = textbox.getBoundingRect();
        const debugRect = new fabric.Rect({
            left: boundingBox.left,
            top: boundingBox.top,
            width: boundingBox.width,
            height: boundingBox.height,
            stroke: 'red',
            strokeWidth: 2,
            fill: 'transparent',
        });
        canvas.add(debugRect);
    }

    const result = await canvasToImage(canvas);

    if (options?.replacement) {
        for (const apparition of apparitions) {
            const pos = findCharCoordinatesInTextbox(textbox, apparition.index);
            const image = options?.replacement[apparition.phrase];
            const style = textbox.getStyleAtPosition(apparition.index, true);
            result.composite(
                image.scaleToFit({ w: style.fontSize!, h: style.fontSize! }),
                pos.x,
                pos.y,
            );
        }
    }

    return result;
};
