import { BoundingBox, Size } from './2d';

export type Position = (
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

export const toBoundingBox = (
    position: Position,
    backgroundSize: Size,
): BoundingBox => {
    const box: BoundingBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
    if ('height' in position) {
        if ('top' in position) {
            box.y = position.top;
            box.height = position.height;
        } else {
            box.y = backgroundSize.height - position.bottom - position.height;
            box.height = position.height;
        }
    } else {
        box.y = position.top;
        box.height = position.bottom - position.top;
    }

    if ('width' in position) {
        if ('left' in position) {
            box.x = position.left;
            box.width = position.width;
        } else {
            box.x = backgroundSize.width - position.right - position.width;
            box.width = position.width;
        }
    } else {
        box.x = position.left;
        box.width = position.right - position.left;
    }

    return box;
};
