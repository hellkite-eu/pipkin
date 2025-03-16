import { TextLayerOptions } from "../types/text";

export const buildFontString = (
    font: TextLayerOptions['font'],
    defaultFontFamily?: string,
): string => {
    const fragments: string[] = [];
    if (font?.bold) {
        fragments.push('bold');
    }
    if (font?.italic) {
        fragments.push('italic');
    }
    if (font?.size) {
        if (font.size) {
            fragments.push(`${font.size}px`);
        }
    } else {
        fragments.push('16px');
    }
    fragments.push(font?.family ?? defaultFontFamily ?? 'Arial');
    return fragments.join(' ');
};
