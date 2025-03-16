import * as fs from 'fs';
import { parse as parseCsv } from 'papaparse';
import { Jimp, rgbaToInt } from 'jimp';
import camelCase from 'lodash.camelcase';

import { placeImage } from './utils/placeImage';
import { createCanvas, registerFont } from 'canvas';
import { buildFontString } from './utils/buildFontString';
import { canvasToImage } from './utils/canvasToImage';
import { drawBoundingBox } from './utils/drawBoundingBox';
import { toPoint, toSize } from './types/2d';
import { ImageType, ImagePosition, ImageLayerOptions, ImageAlignment, ScaleMode } from './types/image';
import {
    TextPosition,
    TextLayerOptions,
    TextAlignmentProps,
    DEFAULT_TEXT_ALIGNMENT_PROPS,
} from './types/text';

export type TemplateOptions = {
    height: number;
    width: number;
    color?: number;
};

export type LayerFnContext = {
    width: number;
    height: number;
    debugMode: boolean;
};

export type LayerFn<EntryType> = (
    entry: EntryType,
    context: LayerFnContext,
) => Promise<ImageType>;

export type TemplateLayerFn<EntryType extends Record<string, string>> = (
    template: Template<EntryType>,
) => Template<EntryType>;

export type ShadowTemplateOptions = {
    /**
     * Create a shadow template with the same size as the original
     */
    copySize?: boolean;
};

const DEFAULT_TEMPLATE_OPTIONS: TemplateOptions = {
    height: 1050,
    width: 750,
    color: rgbaToInt(255, 255, 255, 255),
};

export class Template<EntryType extends Record<string, string>> {
    private readonly layers: LayerFn<EntryType>[] = [];
    private readonly background: ImageType;
    private debugMode: boolean = false;
    private defaultFontFamily?: string;

    // disallow constructor initialization
    private constructor(options: TemplateOptions) {
        this.background = new Jimp({
            height: options.height,
            width: options.width,
            color: options.color,
        });
    }

    static new<EntryType extends Record<string, string>>(
        options: TemplateOptions = DEFAULT_TEMPLATE_OPTIONS,
    ): Template<EntryType> {
        return new Template({
            ...DEFAULT_TEMPLATE_OPTIONS,
            ...options,
        });
    }

    private shadowTemplate(
        options?: ShadowTemplateOptions,
    ): Template<EntryType> {
        return Template.new({
            ...(options?.copySize
                ? {
                      height: this.background.height,
                      width: this.background.width,
                  }
                : DEFAULT_TEMPLATE_OPTIONS),
        });
    }

    private shadowBackground(): ImageType {
        return new Jimp({
            width: this.background.width,
            height: this.background.height,
        });
    }

    layer(fn: LayerFn<EntryType>): this {
        this.layers.push(fn);
        return this;
    }

    templateLayer(fn: TemplateLayerFn<EntryType>): this {
        const template = fn(this.shadowTemplate());
        return this.layer(async entry => template.render(entry));
    }

    imageLayer(
        key: keyof EntryType,
        position: ImagePosition,
        options?: ImageLayerOptions,
    ): this {
        const bg = this.shadowBackground();
        return this.layer(async (entry, { debugMode, width, height }) => {
            const imagePath = entry[key];
            const result = await placeImage(bg, imagePath, position, options);

            // debug mode
            if (debugMode) {
                const debugImage = await drawBoundingBox(position, {
                    width,
                    height,
                });
                return debugImage.composite(result);
            }

            return result;
        });
    }

    staticImageLayer(
        path: string,
        position: ImagePosition,
        options?: ImageLayerOptions,
    ): this {
        const bg = this.shadowBackground();
        return this.layer(async (_, { debugMode, width, height }) => {
            const result = await placeImage(bg, path, position, options);

            // debug mode
            if (debugMode) {
                const debugImage = await drawBoundingBox(position, {
                    width,
                    height,
                });
                return debugImage.composite(result);
            }

            return result;
        });
    }

    textLayer(
        key: keyof EntryType,
        position: TextPosition,
        options?: TextLayerOptions,
    ): this {
        return this.layer(async (entry, { debugMode, width, height }) => {
            const text = entry[key];

            // render image with text
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.font = buildFontString(options?.font, this.defaultFontFamily);
            ctx.fillStyle = options?.color ?? 'black';
            ctx.textAlign =
                position.alignment ?? DEFAULT_TEXT_ALIGNMENT_PROPS.alignment;
            ctx.textBaseline =
                position.baseline ?? DEFAULT_TEXT_ALIGNMENT_PROPS.baseline;
            ctx.fillText(
                text,
                position.anchor.x,
                position.anchor.y,
                position.maxWidth,
            );
            const result = await canvasToImage(canvas);

            // debug mode
            if (debugMode) {
                const textMetrics = ctx.measureText(text);
                const debugImage = await drawBoundingBox(
                    {
                        start: toPoint(
                            position.anchor.x -
                                textMetrics.actualBoundingBoxLeft,
                            position.anchor.y -
                                textMetrics.actualBoundingBoxAscent,
                        ),
                        size: toSize(
                            textMetrics.actualBoundingBoxLeft +
                                textMetrics.actualBoundingBoxRight,
                            textMetrics.actualBoundingBoxDescent +
                                textMetrics.actualBoundingBoxAscent,
                        ),
                    },
                    {
                        width,
                        height,
                    },
                );
                return debugImage.composite(result);
            }

            return result;
        });
    }

    font(path: fs.PathLike, name: string): this {
        registerFont(path.toString(), { family: name });
        return this;
    }

    defaultFont(fontFamily: string): this {
        this.defaultFontFamily = fontFamily;
        return this;
    }

    async renderLayers(entry: EntryType): Promise<Array<ImageType>> {
        return Promise.all(
            this.layers.map(layerFn =>
                layerFn(entry, this.buildLayerContext()),
            ),
        );
    }

    private buildLayerContext(): LayerFnContext {
        return {
            debugMode: this.debugMode,
            width: this.background.width,
            height: this.background.height,
        };
    }

    async render(entry: EntryType): Promise<ImageType> {
        const renderedLayers = await this.renderLayers(entry);
        return renderedLayers.reduce(
            (acc, layerRender) => acc.composite(layerRender),
            this.background.clone(),
        );
    }

    async renderAll(entries: Array<EntryType>): Promise<Array<ImageType>> {
        return Promise.all(entries.map(entry => this.render(entry)));
    }

    async fromCsv(path: string): Promise<Array<ImageType>> {
        return new Promise(async (resolve, reject) => {
            const fileContent = fs.readFileSync(path, 'utf8');
            const parsedData = parseCsv<EntryType>(fileContent, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header, index) =>
                    camelCase(header ?? `header${index}`),
            });
            return Promise.all(parsedData.data.map(this.render));
        });
    }

    debug(): this {
        this.debugMode = true;
        return this;
    }
}
