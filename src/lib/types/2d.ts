export type Size = {
    width: number;
    height: number;
};

// TODO: deprecate and replace with Position, then rename Position to BoundingBox
export type BoundingBox = {
    x: number;
    y: number;
} & Size;
