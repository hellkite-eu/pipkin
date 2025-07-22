import { Jimp } from 'jimp';
import { Size, ImageType } from './types';

type RequiredBundlerOptions = {
    rows: number;
    cols: number;
};

// TODO: move
const PAGE_SIZE_300_PPI: Size = { height: 2480, width: 3508 };

const DEFAULT_BUNDLER_OPTIONS: RequiredBundlerOptions = {
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
            results.push(this.renderPage(images, offset));
        }
        return results;
    }

    private renderPage(images: Array<ImageType>, offset: number): ImageType {
        const { pageSize, cardSize } = this.computeCardAndPageSize(
            images,
            offset,
        );
        const page = new Jimp({
            height: pageSize.height,
            width: pageSize.width,
            color: this.options.bgColor ?? 0xffffffff,
        });
        for (let rowIndex = 0; rowIndex < this.options.rows; rowIndex++) {
            for (let colIndex = 0; colIndex < this.options.cols; colIndex++) {
                const imageIndex = rowIndex * this.options.cols + colIndex;
                const image = images[imageIndex];
                if (!image) {
                    continue;
                }
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

    private computeCardAndPageSize(
        images: Array<ImageType>,
        offset: number,
    ): { cardSize: Size; pageSize: Size } {
        const pageSize: Size = { height: 0, width: 0 };
        const cardSize: Size = { height: 0, width: 0 };
        for (let rowIndex = 0; rowIndex < this.options.rows; rowIndex++) {
            for (let colIndex = 0; colIndex < this.options.cols; colIndex++) {
                const imageIndex =
                    offset + rowIndex * this.options.cols + colIndex;
                const image = images[imageIndex];
                if (!image) {
                    continue;
                }
                cardSize.height = Math.max(cardSize.height, image.height);
                cardSize.width = Math.max(cardSize.width, image.width);
            }
        }
        pageSize.height +=
            this.getPadding('top') +
            cardSize.height * this.options.rows +
            this.getGap('rows') * (this.options.rows - 1) +
            this.getPadding('bottom');
        pageSize.width +=
            this.getPadding('left') +
            cardSize.width * this.options.cols +
            this.getGap('cols') * (this.options.cols - 1) +
            this.getPadding('right');
        return { pageSize, cardSize };
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
