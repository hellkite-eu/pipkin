import * as fs from 'fs';
import { parse as parseCsv } from 'papaparse';
import { Jimp } from 'jimp';
import camelCase from 'lodash.camelcase';
import concat from 'lodash.concat';
import path from 'path';
import {
    placeBoundingBox,
    gridPackingFn,
    hboxPackingFn,
    htmlToImage,
    vboxPackingFn,
    boundingBoxToPx,
    toPx,
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
    TextLayerSpecificOptions,
    SCALE_MODE_TO_OBJECT_FIT,
    StaticImageRef,
    TemplateOptions,
    DEFAULT_TEMPLATE_OPTIONS,
} from './types';
import merge from 'lodash.merge';
import { RequiredDeep } from 'type-fest';
import { h } from 'virtual-dom';
import flatten from 'lodash.flatten';
import { ReplacementBuilder } from './replacement';

export type LayerFnContext = {};

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
    private readonly debugPoints: Array<DebugPoint> = [];
    private readonly background: ImageType;
    private renderBoundingBox?: boolean;
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
                await this.placeImage({
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
        this.layer(async (entry: EntryType) => {
            const mergedOptions: RequiredDeep<ContainerOptions<EntryType>> =
                merge(
                    {},
                    DEFAULT_CONTAINER_OPTIONS,
                    { renderBoundingBox: this.renderBoundingBox },
                    options,
                );
            if (this.shouldSkipLayerForEntry(entry, mergedOptions)) {
                return [];
            }

            const elementRefs = await elementsFn(entry);
            const elements = await Promise.all(
                elementRefs.map(elementRef =>
                    this.elementFromElementRef(entry, elementRef),
                ),
            );
            const result = await packingFn(box, elements);

            // debug mode
            if (mergedOptions.renderBoundingBox) {
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
        this.layer(async entry => {
            const mergedOptions: RequiredDeep<ImageLayerOptions<EntryType>> =
                merge(
                    {},
                    DEFAULT_IMAGE_LAYER_OPTIONS,
                    {
                        assetsPath: this.defaultAssetsPath,
                        renderBoundingBox: this.renderBoundingBox,
                    },
                    options,
                );
            if (this.shouldSkipLayerForEntry(entry, mergedOptions)) {
                return [];
            }

            const image = await this.imageFromImageRef(
                entry,
                ref,
                mergedOptions.assetsPath,
            );
            const result = await this.placeImage({
                image,
                box,
                options: mergedOptions,
            });

            // debug mode
            if (mergedOptions.renderBoundingBox) {
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
        this.layer(async entry => {
            const mergedOptions = merge(
                {},
                DEFAULT_TEXT_LAYER_OPTIONS,
                {
                    font: {
                        family: this.defaultFontFamily,
                    },
                    renderBoundingBox: this.renderBoundingBox,
                } as FontOptions,
                options,
            );
            if (this.shouldSkipLayerForEntry(entry, mergedOptions)) {
                return [];
            }

            const text = this.textFromTextRef(entry, ref);
            const result = await this.placeText({
                text,
                box,
                options: mergedOptions,
            });

            // debug mode
            if (mergedOptions.renderBoundingBox) {
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

    debug = (): this => {
        this.debugPoints.push({
            index: this.layers.length,
        });
        return this;
    };

    async render(entry: EntryType): Promise<ImageType> {
        const results = await Promise.all(
            this.layers.map(layerFn =>
                layerFn(entry, {
                    renderBoundingBox: this.renderBoundingBox,
                }),
            ),
        );
        const buildDocument = (children: Array<HyperNode>) =>
            h('html', [
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
                h('body', children),
            ]);

        // TODO: move it to a proper place
        for (const debugPoint of this.debugPoints) {
            const debugRender = await htmlToImage(
                buildDocument(flatten(results.slice(0, debugPoint.index))),
                this.backgroundSize,
            );
            const debugImage: ImageType = await this.background
                .clone()
                .composite(debugRender);
            await debugImage.write('assets/debug-1.png');
        }

        const render = await htmlToImage(
            buildDocument(flatten(results)),
            this.backgroundSize,
        );
        return this.background.clone().composite(render);
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
        assetsPath: string,
    ): Promise<ImageType> => {
        const pathSegments = [];
        if (assetsPath.length) {
            pathSegments.push(assetsPath);
        }

        if ('key' in ref) {
            const fileName = entry[ref.key];
            return this.loadImage(path.join(...pathSegments, fileName));
        } else if ('pathFn' in ref) {
            const fileName = ref.pathFn(entry);
            return this.loadImage(path.join(...pathSegments, fileName));
        } else {
            return this.imageFromStaticImageRef(ref, assetsPath);
        }
    };

    private imageFromStaticImageRef = async (
        ref: StaticImageRef,
        assetsPath: string,
    ): Promise<ImageType> => {
        const pathSegments = [];
        if (assetsPath.length) {
            pathSegments.push(assetsPath);
        }

        if ('buffer' in ref) {
            return this.loadImage(ref.buffer);
        } else if ('path' in ref) {
            return this.loadImage(path.join(...pathSegments, ref.path));
        } else if ('absolutePath' in ref) {
            return this.loadImage(ref.absolutePath);
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
            return this.prepareText({
                text: this.textFromTextRef(entry, ref.text),
                options,
            });
        } else if ('image' in ref) {
            const options = merge({}, DEFAULT_IMAGE_LAYER_OPTIONS, ref.options);
            return this.prepareImage({
                image: await this.imageFromImageRef(
                    entry,
                    ref.image,
                    options.assetsPath,
                ),
                options,
            });
        } else if ('node' in ref) {
            return ref.node;
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

    private placeText = async ({
        text,
        box,
        options,
    }: {
        text: string;
        box: BoundingBox;
        options: RequiredDeep<TextLayerOptions<EntryType>>;
    }): Promise<HyperNode> => {
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
                await this.prepareText({
                    text,
                    options,
                }),
            ],
        );
    };

    private prepareText = async ({
        text,
        options,
    }: {
        text: string;
        options: RequiredDeep<TextLayerSpecificOptions<EntryType>>;
    }): Promise<HyperNode> => {
        let textChildren: Array<string | HyperNode> = [text];
        const replacementBuilder = new ReplacementBuilder();
        options.replacementFn(replacementBuilder);
        const replacementMap = replacementBuilder.build();
        for (const [word, imageRef] of Object.entries(replacementMap)) {
            const regex = new RegExp(word, 'gi');
            const textOptions: RequiredDeep<ImageLayerOptions<EntryType>> =
                merge(
                    {},
                    DEFAULT_IMAGE_LAYER_OPTIONS,
                    { assetsPath: this.defaultAssetsPath },
                    options,
                );
            const image = await this.imageFromStaticImageRef(
                imageRef,
                textOptions.assetsPath,
            );
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

    private placeImage = async ({
        image,
        box,
        options,
    }: {
        image: ImageType;
        box: BoundingBox;
        options: RequiredDeep<ImageLayerOptions<EntryType>>;
    }): Promise<HyperNode> => {
        return h(
            'div',
            {
                style: {
                    display: 'flex',
                    position: 'absolute',
                    scale: 1,

                    justifyContent: options.justifyContent,
                    alignItems: options.alignItems,

                    ...boundingBoxToPx(box),
                },
            },
            [await this.prepareImage({ image, options })],
        );
    };

    private prepareImage = async ({
        image,
        options,
    }: {
        image: ImageType;
        options: RequiredDeep<ImageLayerSpecificOptions<EntryType>>;
    }): Promise<HyperNode> => {
        const imageBase64 = await image.getBase64('image/png');
        const objectFit = SCALE_MODE_TO_OBJECT_FIT[options.scale];

        return h(
            'img',
            {
                style: {
                    objectFit,
                    flex: '1 1 auto',
                    minWidth: 0,
                    minHeight: 0,
                    maxWidth: '100%',
                    maxHeight: '100%',
                },
                src: imageBase64,
            },
            [],
        );
    };
}

type DebugPoint = {
    index: number;
};
