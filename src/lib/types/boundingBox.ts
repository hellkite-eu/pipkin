export type BoundingBox = (
    | {
          top: number;
          height: number;
      }
    | {
          bottom: number;
          height: number;
      }
    | {
          top: number;
          bottom: number;
      }
) &
    (
        | {
              left: number;
              width: number;
          }
        | {
              right: number;
              width: number;
          }
        | {
              left: number;
              right: number;
          }
    );
