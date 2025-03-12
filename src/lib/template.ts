import * as fs from 'fs';
import {parse as parseCsv} from 'papaparse';
import {Jimp} from 'jimp';
import camelCase from 'lodash.camelcase';
import {
   ImageLayerOptions,
   ImageType,
   LayerPosition,
   TemplateOptions,
} from './types';
import {placeImage} from './placeImage';

type LayerFn<EntryType> = (entry: EntryType) => Promise<ImageType>;

type TemplateLayerFn<EntryType extends Record<string, string>> = (
   entry: EntryType,
   template: Template<EntryType>,
) => Promise<Template<EntryType>>;

type ShadowTemplateOptions = {
   /**
    * Create a shadow template with the same size as the original
    */
   copySize?: boolean;
};

const DEFAULT_TEMPLATE_OPTIONS: TemplateOptions = {
   // TODO: look for some good defaults
   height: 1024,
   width: 1024,
};

export class Template<EntryType extends Record<string, string>> {
   private readonly layers: LayerFn<EntryType>[] = [];
   private readonly background: ImageType;

   // disallow constructor initialization
   private constructor(options: TemplateOptions) {
      this.background = new Jimp({
         height: options.height,
         width: options.width,
      });
   }

   static new<EntryType extends Record<string, string>>(
      options: TemplateOptions = DEFAULT_TEMPLATE_OPTIONS,
   ): Template<EntryType> {
      // TODO: initial config
      return new Template(options);
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

   layer(fn: LayerFn<EntryType>): this {
      this.layers.push(fn);
      return this;
   }

   templateLayer(fn: TemplateLayerFn<EntryType>): this {
      return this.layer(async entry =>
         (await fn(entry, this.shadowTemplate())).render(entry),
      );
   }

   imageLayer(
      key: keyof EntryType,
      position: LayerPosition,
      options?: ImageLayerOptions,
   ): this {
      return this.layer(async entry => {
         const imagePath = entry[key];
         return placeImage(
            new Jimp({
               height: this.background.height,
               width: this.background.width,
            }),
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
         placeImage(
            new Jimp({
               height: this.background.height,
               width: this.background.width,
            }),
            path,
            position,
            options,
         ),
      );
   }

   // textLayer(
   //    key: keyof EntryType, options?: TextLayerOptions
   // ): this {
   //   return this.layer(entry => {
   //       const text = entry[key];
   //       new Jimp({})
   //       // TODO: process according to options

   //       return image;
   //    });
   // }

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
