export type Size = {
    width: number;
    height: number;
};

export type BoundingBox = {
    x: number;
    y: number;
} & Size;
