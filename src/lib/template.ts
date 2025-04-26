import * as fs from 'fs';
import { parse as parseCsv } from 'papaparse';
import { Jimp, rgbaToInt } from 'jimp';
import camelCase from 'lodash.camelcase';
import concat from 'lodash.concat';
import path from 'path';
import {
    placeBoundingBox,
    gridPackingFn,
    hboxPackingFn,
    htmlToImage,
    placeImage,
    placeText,
    vboxPackingFn,
    prepareText,
    prepareImage,
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
    GridContainerOptions,
    DEFAULT_TEXT_LAYER_OPTIONS,
    FontOptions,
    DEFAULT_IMAGE_LAYER_OPTIONS,
    LayerOptions,
    ContainerOptions,
    DEFAULT_CONTAINER_OPTIONS,
    HyperNode,
    ElementsFn,
    ElementRef,
    ImageLayerSpecificOptions,
} from './types';
import merge from 'lodash.merge';
import { RequiredDeep } from 'type-fest';
import { h } from 'virtual-dom';
import flatten from 'lodash.flatten';

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
) => Promise<Array<HyperNode>>;

export type TemplateLayerFn<EntryType extends Record<string, string>> = (
    template: Template<EntryType>,
) => Template<EntryType>;

export class Template<EntryType extends Record<string, string>> {
    private readonly fonts: Record<string, string> = {};
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
        this.layer(async entry => {
            const template = fn(this.shadowTemplate());
            const image = await template.render(entry);
            return [
                await placeImage({
                    image,
                    box: {
                        left: 0,
                        top: 0,
                        ...this.backgroundSize,
                    },
                    options: DEFAULT_IMAGE_LAYER_OPTIONS,
                }),
            ];
        });

    container = (
        elementsFn: ElementsFn,
        box: BoundingBox,
        packingFn: PackingFn,
        options?: ContainerOptions<EntryType>,
    ): this =>
        this.layer(async (entry: EntryType, { debugMode }) => {
            const mergedOptions: RequiredDeep<ContainerOptions<EntryType>> =
                merge({}, DEFAULT_CONTAINER_OPTIONS, options);
            if (this.shouldSkipLayerForEntry(entry, mergedOptions)) {
                return [];
            }

            const elementRefs = await elementsFn(entry);
            const elements = await Promise.all(elementRefs.map(elementRef => this.elementFromElementRef(entry, elementRef)))
            const result = await packingFn(box, elements);

            // debug mode
            if (debugMode) {
                const debugImage = await placeBoundingBox(box);
                return [result, debugImage];
            }

            return [result];
        });

    hbox = (
        elementsFn: ElementsFn,
        box: BoundingBox,
        options?: DirectionContainerOptions<EntryType>,
    ): this => this.container(elementsFn, box, hboxPackingFn(options), options);

    vbox = (
        elementsFn: ElementsFn,
        box: BoundingBox,
        options?: DirectionContainerOptions<EntryType>,
    ): this => this.container(elementsFn, box, vboxPackingFn(options), options);

    grid = (
        elementsFn: ElementsFn,
        box: BoundingBox,
        options?: GridContainerOptions<EntryType>,
    ): this => this.container(elementsFn, box, gridPackingFn(options), options);

    image = (
        ref: ImageRef<EntryType>,
        box: BoundingBox,
        options: ImageLayerOptions<EntryType>,
    ): this =>
        this.layer(async (entry, { debugMode }) => {
            const mergedOptions: RequiredDeep<ImageLayerOptions<EntryType>> =
                merge(
                    {},
                    DEFAULT_IMAGE_LAYER_OPTIONS,
                    { assetsPath: this.defaultAssetsPath },
                    options,
                );
            if (this.shouldSkipLayerForEntry(entry, mergedOptions)) {
                return [];
            }

            const image = await this.imageFromImageRef(
                entry,
                ref,
                mergedOptions,
            );
            const result = await placeImage({
                image,
                box,
                options: mergedOptions,
            });

            // debug mode
            if (debugMode) {
                const debugImage = await placeBoundingBox(box);
                return [result, debugImage];
            }

            return [result];
        });

    loadImage = async (imagePath: string | Buffer): Promise<ImageType> => {
        const image = (await Jimp.read(imagePath)) as unknown as ImageType;
        return image;
    };

    text = (
        ref: TextRef<EntryType>,
        box: BoundingBox,
        options?: TextLayerOptions<EntryType>,
    ): this =>
        this.layer(async (entry, { debugMode }) => {
            const mergedOptions = merge(
                {},
                DEFAULT_TEXT_LAYER_OPTIONS,
                {
                    font: {
                        family: this.defaultFontFamily,
                    },
                } as FontOptions,
                options,
            );
            if (this.shouldSkipLayerForEntry(entry, mergedOptions)) {
                return [];
            }

            const text = this.textFromTextRef(entry, ref);
            const result = await placeText({
                text,
                box,
                options: mergedOptions,
            });

            // debug mode
            if (debugMode) {
                const debugImage = await placeBoundingBox(box);
                return [result, debugImage];
            }

            return [result];
        });

    font(path: fs.PathLike, name: string): this {
        // TODO: pass font weight and font style as well
        this.fonts[name] = fs.readFileSync(path.toString()).toString('base64');
        return this;
    }

    debug(): this {
        this.debugMode = true;
        return this;
    }

    async render(entry: EntryType): Promise<ImageType> {
        const results = await Promise.all(
            this.layers.map(layerFn =>
                layerFn(entry, {
                    debugMode: this.debugMode,
                }),
            ),
        );
        const document = h('html', [
            h('head', [
                h(
                    'style',
                    Object.entries(this.fonts)
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
            h(
                'body',
                flatten(results),
            ),
        ]);
        const renderedLayers = await htmlToImage(document, this.backgroundSize);
        return this.background.clone().composite(renderedLayers);
    }

    async renderAll(
        entries: Array<EntryType>,
        options?: RenderOptions<EntryType>,
    ): Promise<Array<ImageType>> {
        const results: Array<Array<ImageType>> = await Promise.all(
            entries.map(
                entry =>
                    new Promise<Array<ImageType>>(resolve =>
                        this.render(entry).then(image => {
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

    private imageFromImageRef = async (
        entry: EntryType,
        ref: ImageRef<EntryType>,
        options: RequiredDeep<ImageLayerSpecificOptions<EntryType>>,
    ): Promise<ImageType> => {
        const pathSegments = [];
        if (options.assetsPath) {
            pathSegments.push(options.assetsPath);
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

    private textFromTextRef = (
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

    private elementFromElementRef = async (
        entry: EntryType,
        ref: ElementRef<EntryType>,
    ): Promise<HyperNode> => {
        if ('text' in ref) {
            const options = merge({}, DEFAULT_TEXT_LAYER_OPTIONS, ref.options);
            return prepareText({
                text: this.textFromTextRef(entry, ref.text),
                options,
            });
        } else if ('image' in ref) {
            const options = merge({}, DEFAULT_IMAGE_LAYER_OPTIONS, ref.options);
            return prepareImage({
                image: await this.imageFromImageRef(entry, ref.image, options),
                options,
            });
        } else if ('node' in ref) {
            return ref.node
        } else {
            throw new Error('Unknown TextRef variant');
        }
    };

    private shouldSkipLayerForEntry = (
        entry: EntryType,
        options: LayerOptions<EntryType>,
    ): boolean => {
        if (typeof options.skip === 'function') {
            return options.skip(entry);
        }
        return options.skip ?? false;
    };
}
