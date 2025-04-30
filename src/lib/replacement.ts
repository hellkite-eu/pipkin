import { ReplacementMap, StaticImageRef } from "./types";

/**
 * Represents a replacement map between sets of words and symbols
 */
export class Replacement {
    protected readonly replacementMap: ReplacementMap = {};

    replace(words: Array<string>, symbol: StaticImageRef): this {
        words.forEach(word => {
            this.replacementMap[word] = symbol;
        });
        return this;
    }
}

export class ReplacementBuilder extends Replacement {
    build(): ReplacementMap {
        return this.replacementMap;
    }
}

