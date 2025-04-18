import { FontOptions } from "../types";

export const buildFontString = (
    font: FontOptions,
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
    fragments.push(`"${font?.family ?? defaultFontFamily ?? 'Arial'}"`);
    return fragments.join(' ');
};
