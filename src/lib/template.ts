import * as fs from 'fs';
import { parse as parseCsv } from 'papaparse';
import { Jimp, rgbaToInt } from 'jimp';
import camelCase from 'lodash.camelcase';
import concat from 'lodash.concat';
import { registerFont } from 'canvas';
import path from 'path';
import {
    drawBoundingBox,
    hboxPackingFn,
    placeImage,
    renderText,
    vboxPackingFn,
} from './utils';
import {
    DirectionContainerOptions,
    ImageLayerOptions,
    ImageRef,
    ImageType,
    PackingFn,
    BoundingBox,
    RenderOptions,
    Size,
    TextLayerOptions,
    TextRef,
} from './types';

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

    private get backgroundSize(): Size {
        return {
            width: this.background.width,
            height: this.background.height,
        };
    }

    layer(fn: LayerFn<EntryType>): this {
        this.layers.push(fn);
        return this;
    }

    template = (fn: TemplateLayerFn<EntryType>): this =>
        this.layer(entry => {
            const template = fn(this.shadowTemplate());
            return template.render(entry);
        });

    // TODO: logic for rendering debug helpers
    container = (
        imagesFn: (entry: EntryType) => Promise<Array<ImageType>>,
        box: BoundingBox,
        packingFn: PackingFn,
    ): this =>
        this.layer(async (entry: EntryType, { debugMode }) => {
            const images = await imagesFn(entry);
            const result = await packingFn(box, this.shadowBackground(), images);

            // debug mode
            if (debugMode) {
                const debugImage = await drawBoundingBox(
                    box,
                    this.backgroundSize,
                );
                return debugImage.composite(result);
            }

            return result;
        });

    hbox = (
        imagesFn: (entry: EntryType) => Promise<Array<ImageType>>,
        box: BoundingBox,
        options?: DirectionContainerOptions,
    ): this => this.container(imagesFn, box, hboxPackingFn(options));

    vbox = (
        imagesFn: (entry: EntryType) => Promise<Array<ImageType>>,
        box: BoundingBox,
        options?: DirectionContainerOptions,
    ): this => this.container(imagesFn, box, vboxPackingFn(options));

    image = (
        ref: ImageRef<EntryType>,
        box: BoundingBox,
        options: ImageLayerOptions,
    ): this =>
        this.layer(async (entry, { debugMode }) => {
            const image = await this.pathFromImageRef(entry, ref, options);
            const result = await placeImage({
                image,
                box,
                backgroundSize: this.backgroundSize,
                options,
            });

            // debug mode
            if (debugMode) {
                const debugImage = await drawBoundingBox(
                    box,
                    this.backgroundSize,
                );
                return debugImage.composite(result);
            }

            return result;
        });
    loadImage = async (imagePath: string | Buffer): Promise<ImageType> => {
        const image = (await Jimp.read(imagePath)) as unknown as ImageType;
        return image;
    };

    text = (
        ref: TextRef<EntryType>,
        box: BoundingBox,
        options?: TextLayerOptions,
    ): this =>
        this.layer(async (entry, { debugMode }) => {
            const text = this.textFromImageRef(entry, ref);
            const fontFamily =
                options?.font?.family ?? this.defaultFontFamily ?? 'Arial';
            const result = await renderText(text, box, this.backgroundSize, {
                ...options,
                font: { ...options?.font, family: fontFamily },
            });

            // debug mode
            if (debugMode) {
                const debugImage = await drawBoundingBox(
                    box,
                    this.backgroundSize,
                );
                return debugImage.composite(result);
            }

            return result;
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

    private async renderLayers(entry: EntryType): Promise<Array<ImageType>> {
        return Promise.all(
            this.layers.map(layerFn =>
                layerFn(entry, {
                    debugMode: this.debugMode,
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

    private pathFromImageRef = async (
        entry: EntryType,
        ref: ImageRef<EntryType>,
        options: ImageLayerOptions,
    ): Promise<ImageType> => {
        const assetsPath = options?.assetsPath ?? this.defaultAssetsPath;
        const pathSegments = [];
        if (assetsPath) {
            pathSegments.push(assetsPath);
        }

        if ('buffer' in ref) {
            return this.loadImage(ref.buffer);
        } else if ('path' in ref) {
            return this.loadImage(path.join(...pathSegments, ref.path));
        } else if ('absolutePath' in ref) {
            return this.loadImage(ref.absolutePath);
        } else if ('key' in ref) {
            const fileName = entry[ref.key];
            return this.loadImage(path.join(...pathSegments, fileName));
        } else if ('pathFn' in ref) {
            const fileName = ref.pathFn(entry);
            return this.loadImage(path.join(...pathSegments, fileName));
        } else {
            throw new Error('Unknown ImageRef variant');
        }
    };

    private textFromImageRef = (
        entry: EntryType,
        ref: TextRef<EntryType>,
    ): string => {
        if ('key' in ref) {
            return entry[ref.key];
        } else if ('text' in ref) {
            return ref.text;
        } else if ('textFn' in ref) {
            return ref.textFn(entry);
        } else {
            throw new Error('Unknown TextRef variant');
        }
    };
}

// TODO: Ledger of actions applied to the image like a logging feed
