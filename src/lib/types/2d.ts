export type Point = {
    x: number;
    y: number;
};

export type Size = {
    width: number;
    height: number;
};

// TODO: keep properties in the open
export type BoundingBox = Point & Size;

export const toPoint = (x: number, y: number): Point => ({ x, y });

export const toSize = (w: number, h: number): Size => ({ width: w, height: h });
