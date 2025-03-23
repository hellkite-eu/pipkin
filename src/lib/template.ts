import * as fs from 'fs';
import { parse as parseCsv } from 'papaparse';
import { Jimp, rgbaToInt } from 'jimp';
import camelCase from 'lodash.camelcase';
import { placeImage } from './utils/placeImage';
import { drawBoundingBox } from './utils/drawBoundingBox';
import { ImageType, ImagePosition, ImageLayerOptions } from './types/image';
import {
    TextPosition,
    TextLayerOptions,
    DEFAULT_TEXT_ALIGNMENT_PROPS,
} from './types/text';
import { RenderOptions } from './types/render';
import concat from 'lodash.concat';
import * as fabric from 'fabric/node';
import { canvasToImage } from './utils/canvasToImage';
import { registerFont } from 'canvas';
import { enhanceTextbox } from './utils/enhanceTextbox';

type RequiredTemplateOptions = {
    height: number;
    width: number;
    color: number;
};

type OptionalTemplateOptions = Partial<{
    defaultFontFamily: string;
    defaultAssetsPath: string;
}>;

export type TemplateOptions = RequiredTemplateOptions & OptionalTemplateOptions;

const DEFAULT_TEMPLATE_OPTIONS: RequiredTemplateOptions = {
    height: 1050,
    width: 750,
    color: rgbaToInt(255, 255, 255, 255),
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

export class Template<EntryType extends Record<string, string>> {
    private readonly layers: LayerFn<EntryType>[] = [];
    private readonly background: ImageType;
    private debugMode: boolean = false;
    private defaultFontFamily?: string;
    private defaultAssetsPath?: string;

    // disallow constructor initialization
    private constructor(options: TemplateOptions) {
        this.background = new Jimp({
            height: options.height,
            width: options.width,
            color: options.color,
        });
        this.defaultFontFamily = options.defaultFontFamily;
        this.defaultAssetsPath = options.defaultAssetsPath;
    }

    static new<EntryType extends Record<string, string>>(
        options?: Partial<TemplateOptions>,
    ): Template<EntryType> {
        return new Template({
            ...DEFAULT_TEMPLATE_OPTIONS,
            ...options,
        });
    }

    private shadowTemplate(): Template<EntryType> {
        return Template.new({
            height: this.background.height,
            width: this.background.width,
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

    templateLayer = (fn: TemplateLayerFn<EntryType>): this =>
        this.layer(entry => {
            const template = fn(this.shadowTemplate());
            return template.render(entry);
        });

    imageLayer = (
        key: keyof EntryType,
        position: ImagePosition,
        options?: ImageLayerOptions,
    ): this =>
        this.layer(async (entry, { debugMode, width, height }) => {
            const imagePath = options?.pathFn
                ? options.pathFn(entry[key])
                : entry[key];
            const result = await placeImage(
                this.shadowBackground(),
                imagePath,
                position,
                options,
                this.defaultAssetsPath,
            );

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

    staticImageLayer = (
        path: string,
        position: ImagePosition,
        options?: ImageLayerOptions,
    ): this =>
        this.layer(async (_, { debugMode, width, height }) => {
            const result = await placeImage(
                this.shadowBackground(),
                path,
                position,
                options,
                this.defaultAssetsPath,
            );

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

    textLayer = (
        key: keyof EntryType,
        position: TextPosition,
        options?: TextLayerOptions,
    ): this =>
        this.layer(async (entry, { debugMode, width, height }) => {
            const text = entry[key] as string;
            const canvas = new fabric.Canvas(undefined, { width, height });
            return enhanceTextbox(
                text,
                canvas,
                options?.font?.family ?? this.defaultFontFamily ?? 'Arial',
                debugMode,
                position,
                options,
            );
        });

    font(path: fs.PathLike, name: string): this {
        registerFont(path.toString(), {
            family: name,
        });
        return this;
    }

    debug(): this {
        this.debugMode = true;
        return this;
    }

    async renderLayers(entry: EntryType): Promise<Array<ImageType>> {
        return Promise.all(
            this.layers.map(layerFn =>
                layerFn(entry, {
                    debugMode: this.debugMode,
                    width: this.background.width,
                    height: this.background.height,
                }),
            ),
        );
    }

    async render(
        entry: EntryType,
        options?: RenderOptions<EntryType>,
    ): Promise<ImageType> {
        const renderedLayers = await this.renderLayers(entry);
        return renderedLayers.reduce(
            (acc, layerRender) => acc.composite(layerRender),
            this.background.clone(),
        );
    }

    async renderAll(
        entries: Array<EntryType>,
        options?: RenderOptions<EntryType>,
    ): Promise<Array<ImageType>> {
        const results: Array<Array<ImageType>> = await Promise.all(
            entries.map(
                entry =>
                    new Promise<Array<ImageType>>(resolve =>
                        this.render(entry, options).then(image => {
                            if (!options?.duplication) {
                                return resolve([image]);
                            }

                            let copies = parseInt(
                                entry[options.duplication.countField],
                            );
                            if (Number.isNaN(copies)) {
                                copies = options.duplication.default ?? 1;
                            }

                            const deepCopy =
                                options.duplication.deepCopy ?? false;
                            return resolve([
                                image,
                                // no need to clone the first one as well
                                ...Array.from({ length: copies - 1 }, () =>
                                    deepCopy ? image.clone() : image,
                                ),
                            ]);
                        }),
                    ),
            ),
        );
        return concat(...results);
    }

    async fromCsv(
        path: string,
        options?: RenderOptions<EntryType>,
    ): Promise<Array<ImageType>> {
        return new Promise((resolve, reject) => {
            try {
                const fileContent = fs.readFileSync(path, 'utf8');
                const parsedData = parseCsv<EntryType>(fileContent, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header, index) =>
                        camelCase(header ?? `header${index}`),
                });
                resolve(this.renderAll(parsedData.data, options));
            } catch (err) {
                reject(err);
            }
        });
    }
}

// TODO: Ledger of actions applied to the image like a logging feed
