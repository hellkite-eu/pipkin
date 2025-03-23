import { ImageType } from "./types/image";
import { ReplacementMap } from "./types/replacement";

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

