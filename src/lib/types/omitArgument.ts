export type OmitArgument<
    T extends (...args: any[]) => any,
    K extends number,
> = T extends (...args: infer P) => infer R
    ? (...args: TupleFilter<P, K>) => R
    : never;

// Helper type to remove an argument at index K
type TupleFilter<
    T extends any[],
    K extends number,
    I extends any[] = [],
> = T extends [infer First, ...infer Rest]
    ? I['length'] extends K
        ? [...I, ...Rest] // Skip the K-th element
        : TupleFilter<Rest, K, [...I, First]>
    : I;
