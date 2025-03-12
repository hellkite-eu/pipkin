import * as fs from 'fs';
import {parse as parseCsv} from 'papaparse';
import {HorizontalAlign, Jimp, loadFont, rgbaToInt, VerticalAlign} from 'jimp';
import camelCase from 'lodash.camelcase';
import {
   Alignment,
   CANVAS_BASELINE_MAPPING,
   DEFAULT_ALIGNMENT,
   FontType,
   ImageLayerOptions,
   ImageType,
   LayerPosition,
   TemplateOptions,
   TextLayerOptions,
} from './types';
import {placeImage} from './placeImage';
import {SANS_32_BLACK, SANS_64_BLACK} from 'jimp/fonts';
import {CanvasTextBaseline, createCanvas} from 'canvas';

type LayerFn<EntryType> = (entry: EntryType) => Promise<ImageType>;

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
      position: LayerPosition,
      options?: ImageLayerOptions,
   ): this {
      return this.layer(async entry => {
         const imagePath = entry[key];
         return placeImage(
            this.shadowBackground(),
            imagePath,
            position,
            options,
         );
      });
   }

   staticImageLayer(
      path: string,
      position: LayerPosition,
      options?: ImageLayerOptions,
   ): this {
      return this.layer(async () =>
         placeImage(this.shadowBackground(), path, position, options),
      );
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
      position: LayerPosition,
      options?: TextLayerOptions,
   ): this {
      return this.layer(async entry => {
         const text = entry[key];

         // Create a new canvas
         const canvas = createCanvas(
            this.background.width,
            this.background.height,
         );
         const ctx = canvas.getContext('2d');

         // handle alignment inside the bounding box
         const xAlignment =
            position.xAlignment ?? position.alignment ?? DEFAULT_ALIGNMENT;
         const yAlignment =
            position.yAlignment ?? position.alignment ?? DEFAULT_ALIGNMENT;

         // TODO: Default font per template
         // TODO: Proper font loading
         // TODO: Move font loading out of the iterator function
         ctx.font = this.buildFontString(options?.font);
         ctx.fillStyle = options?.color ?? 'black';
         ctx.textAlign = xAlignment ?? DEFAULT_ALIGNMENT;
         ctx.textBaseline = CANVAS_BASELINE_MAPPING[yAlignment ?? DEFAULT_ALIGNMENT];

         ctx.fillText(
            text,
            position.start.x,
            position.start.y,
            position.size.x,
         );

         // TODO: handle height overflow
         return await Jimp.fromBitmap(
            ctx.getImageData(0, 0, canvas.width, canvas.height),
         );
      });
   }

   async render(entry: EntryType): Promise<ImageType> {
      let acc = this.background;
      for (const layerFn of this.layers) {
         const layerRender = await layerFn(entry);
         acc.composite(layerRender);
      }
      return acc;
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
}
