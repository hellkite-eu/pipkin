export type Point = {
    x: number;
    y: number;
};

export type Size = {
    width: number;
    height: number;
};

export const toPoint = (x: number, y: number): Point => ({ x, y });

export const toSize = (w: number, h: number): Size => ({ width: w, height: h });
