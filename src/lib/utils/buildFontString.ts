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
    fragments.push(`${font?.size ?? 16}px`);
    fragments.push(font?.family ?? defaultFontFamily ?? 'Arial');
    return fragments.join(' ');
};
