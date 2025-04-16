import { ReplacementMap, ImageType } from "./types";

/**
 * Represents a replacement map between sets of words and symbols
 */
export class Replacement {

    private readonly replacementMap: ReplacementMap = {};

    replace(words: Array<string>, symbol: ImageType): this {
        words.forEach(word => {
            this.replacementMap[word] = symbol.clone();
        });
        return this;
    }

    build(): ReplacementMap {
        return this.replacementMap;
    }
}

