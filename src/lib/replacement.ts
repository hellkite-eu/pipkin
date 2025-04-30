import { ReplacementMap, StaticImageRef } from "./types";

/**
 * Represents a replacement map between sets of words and symbols
 */
export class Replacement {

    private readonly replacementMap: ReplacementMap = {};

    replace(words: Array<string>, symbol: StaticImageRef): this {
        words.forEach(word => {
            this.replacementMap[word] = symbol;
        });
        return this;
    }

    build(): ReplacementMap {
        return this.replacementMap;
    }
}

