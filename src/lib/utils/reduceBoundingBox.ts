import { BoundingBox } from '../types';

type KeysOfUnion<T> = T extends unknown ? keyof T : never;

export const reduceBoundingBox = (
    boundingBox: BoundingBox,
    reduceWithPx: number,
): BoundingBox => {
    return (Object.entries(boundingBox) as [KeysOfUnion<BoundingBox>, number][])
        .map(([key, value]) => [
            key,
            value +
                (key === 'width' || key === 'height'
                    ? -reduceWithPx * 2
                    : reduceWithPx),
        ])
        .reduce(
            (box, [key, value]) => ({ ...box, [key]: value }),
            {} as BoundingBox,
        );
};
