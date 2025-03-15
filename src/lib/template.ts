import * as fs from 'fs';
import {parse as parseCsv} from 'papaparse';
import {Jimp, loadFont, rgbaToInt} from 'jimp';
import camelCase from 'lodash.camelcase';
import {
   BoundingBox,
   FontType,
   ImageLayerOptions,
   ImageType,
   ImagePosition,
   Size,
   TemplateOptions,
   TextLayerOptions,
   TextPosition,
   DEFAULT_TEXT_ALIGNMENT_PROPS,
   toSize,
   toPoint,
} from './types';
import {placeImage} from './placeImage';
import {Canvas, createCanvas} from 'canvas';

type LayerFnContext = {
   width: number;
   height: number;
   debugMode: boolean;
};

type LayerFn<EntryType> = (
   entry: EntryType,
   context: LayerFnContext,
) => Promise<ImageType>;

type TemplateLayerFn<EntryType extends Record<string, string>> = (
   template: Template<EntryType>,
) => Template<EntryType>;

type ShadowTemplateOptions = {
   /**
    * Create a shadow template with the same size as the original
    */
   copySize?: boolean;
};

const DEFAULT_TEMPLATE_OPTIONS: TemplateOptions = {
   // TODO: look for some good defaults
   height: 1050,
   width: 750,
   color: rgbaToInt(255, 255, 255, 255),
};

export class Template<EntryType extends Record<string, string>> {
   private readonly layers: LayerFn<EntryType>[] = [];
   private readonly background: ImageType;
   private readonly fontRegistry: Record<string, FontType> = {};
   private debugMode: boolean = false;

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
            ? {height: this.background.height, width: this.background.width}
            : DEFAULT_TEMPLATE_OPTIONS),
      });
   }

   private shadowBackground(): ImageType {
      return new Jimp({
         width: this.background.width,
         height: this.background.height,
      });
   }

   /**
    * Fetches fonts efficiently from the template's current registry
    * or loads it from disk and stores it for future use
    */
   private async getFont(fontId: string): Promise<FontType> {
      if (!this.fontRegistry[fontId]) {
         const font = await loadFont(fontId);
         this.fontRegistry[fontId] = font;
      }
      return this.fontRegistry[fontId];
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
      return this.layer(async (entry, {debugMode, width, height}) => {
         const imagePath = entry[key];
         const result = await placeImage(bg, imagePath, position, options);

         // debug mode
         if (debugMode) {
            const debugImage = await this.drawBoundingBox(position, {
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
      return this.layer(async (_, {debugMode, width, height}) => {
         const result = await placeImage(bg, path, position, options);

         // debug mode
         if (debugMode) {
            const debugImage = await this.drawBoundingBox(position, {
               width,
               height,
            });
            return debugImage.composite(result);
         }

         return result;
      });
   }

   // TODO: extract all
   private buildFontString(font: TextLayerOptions['font']) {
      const fragments: string[] = [];
      if (font?.bold) {
         fragments.push('bold');
      }
      if (font?.italic) {
         fragments.push('italic');
      }
      if (font?.size) {
         if (font.size.px) {
            fragments.push(`${font.size.px}px`);
         }
      } else {
         fragments.push('16px');
      }
      fragments.push(font?.family ? font.family : 'Arial');
      return fragments.join(' ');
   }

   textLayer(
      key: keyof EntryType,
      position: TextPosition,
      options?: TextLayerOptions,
   ): this {
      return this.layer(async (entry, {debugMode, width, height}) => {
         const text = entry[key];

         // init canvas
         const canvas = createCanvas(width, height);
         const ctx = canvas.getContext('2d');

         // TODO: Default font per template
         // TODO: Proper font loading
         // TODO: Move font loading out of the iterator function
         ctx.font = this.buildFontString(options?.font);
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

         const result = await this.canvasToImage(canvas);

         // debug mode
         if (debugMode) {
            const textMetrics = ctx.measureText(text);
            console.log('textMetrics', textMetrics);

            // TODO: render max box as well

            const debugImage = await this.drawBoundingBox(
               {
                  start: toPoint(
                     position.anchor.x - textMetrics.actualBoundingBoxLeft,
                     position.anchor.y - textMetrics.actualBoundingBoxAscent,
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

   private async canvasToImage(canvas: Canvas): Promise<ImageType> {
      const ctx = canvas.getContext('2d');
      return Jimp.fromBitmap(
         ctx.getImageData(0, 0, canvas.width, canvas.height),
      );
   }

   // TODO: extract somewhere else
   private async drawBoundingBox(
      box: BoundingBox,
      imageSize: Size,
   ): Promise<ImageType> {
      const canvas = createCanvas(imageSize.width, imageSize.height);
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = 'red';

      ctx.strokeRect(box.start.x, box.start.y, box.size.width, box.size.height);

      return this.canvasToImage(canvas);
   }

   async renderLayers(entry: EntryType): Promise<Array<ImageType>> {
      // TODO: render bounding box when in debug mode
      return Promise.all(
         this.layers.map(layerFn => layerFn(entry, this.buildLayerContext())),
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
