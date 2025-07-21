import { Jimp } from 'jimp';
import { Size, ImageType } from './types';

type RequiredBundlerOptions = {
    size: Size;
    rows: number;
    cols: number;
};

const PAGE_SIZE_300_PPI: Size = { height: 2480, width: 3508 };

const DEFAULT_PAGE_SIZE: Size = PAGE_SIZE_300_PPI;

const DEFAULT_BUNDLER_OPTIONS: RequiredBundlerOptions = {
    size: DEFAULT_PAGE_SIZE,
    rows: 2,
    cols: 4,
};

// TODO: better name
type Direction2 = { rows?: number; cols?: number };
type Direction4 = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
};

type OptionalBundlerOptions = Partial<{
    /**
     * fallback to 0
     */
    gap: number | Direction2;
    /**
     * fallback to 0
     */
    padding: number | Direction2 | Direction4;
    /**
     * Page background color represented as hex
     * Default white (`0xffffffff`)
     */
    bgColor: string | number;
}>;

export type BundlerOptions = RequiredBundlerOptions & OptionalBundlerOptions;

/**
 * Group a list of images to be easily printed together
 *
 * Note: the assumption is that all of the images have the same size.
 */
export class Bundler {
    // disallow constructor initialization
    private constructor(private readonly options: BundlerOptions) {}

    static new(options?: Partial<BundlerOptions>): Bundler {
        return new Bundler({
            ...DEFAULT_BUNDLER_OPTIONS,
            ...options,
        });
    }

    bundle(images: Array<ImageType>): Array<ImageType> {
        const cardsPerPage = this.options.cols * this.options.rows;
        const results: Array<ImageType> = [];
        for (let offset = 0; offset <= images.length; offset += cardsPerPage) {
            results.push(
                this.renderPage(images.slice(offset, offset + cardsPerPage)),
            );
        }
        return results;
    }

    private renderPage(images: Array<ImageType>): ImageType {
        const page = new Jimp({
            height: this.options.size.height,
            width: this.options.size.width,
            color: this.options.bgColor ?? 0xffffffff,
        });
        const cardSize: Size = {
            width:
                (page.width -
                    this.getPadding('left') -
                    this.getPadding('right') -
                    this.getGap('cols')) /
                this.options.cols,
            height:
                (page.height -
                    this.getPadding('top') -
                    this.getPadding('bottom') -
                    this.getGap('rows')) /
                this.options.rows,
        };
        for (let rowIndex = 0; rowIndex < this.options.rows; rowIndex++) {
            for (let colIndex = 0; colIndex < this.options.cols; colIndex++) {
                const imageIndex = rowIndex * this.options.cols + colIndex;
                const image = images[imageIndex];
                if (!image) {
                    continue;
                }
                image.scaleToFit({
                    w: cardSize.width,
                    h: cardSize.height,
                });
                const offsetX =
                    this.getPadding('left') +
                    colIndex * this.getGap('cols') +
                    colIndex * cardSize.width;
                const offsetY =
                    this.getPadding('top') +
                    rowIndex * this.getGap('rows') +
                    rowIndex * cardSize.height;
                page.composite(image, offsetX, offsetY);
            }
        }
        return page;
    }

    private getGap(direction: keyof Direction2): number {
        if (typeof this.options.gap === 'number') {
            return this.options.gap;
        } else if (typeof this.options.gap === 'object') {
            return (
                (direction === 'cols'
                    ? this.options.gap.cols
                    : this.options.gap.rows) ?? 0
            );
        }
        return 0;
    }

    private getPadding(direction: keyof Direction4): number {
        if (typeof this.options.padding === 'number') {
            return this.options.padding;
        } else if (typeof this.options.padding === 'object') {
            if (
                'rows' in this.options.padding ||
                'cols' in this.options.padding
            ) {
                switch (direction) {
                    case 'top':
                    case 'bottom':
                        return this.options.padding.rows ?? 0;
                    case 'right':
                    case 'left':
                        return this.options.padding.cols ?? 0;
                }
            } else {
                return (this.options.padding as Direction4)[direction] ?? 0;
            }
        }
        return 0;
    }
}
