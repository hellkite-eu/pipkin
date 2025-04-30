import { rgbaToInt } from "jimp";

type RequiredTemplateOptions = {
    height: number;
    width: number;
    color: number;
};

type OptionalTemplateOptions = Partial<{
    defaultFontFamily: string;
    defaultAssetsPath: string;
    // TODO: defaultOutputDirectoryPath
    debug: boolean;
}>;

export type TemplateOptions = RequiredTemplateOptions & OptionalTemplateOptions;

export const DEFAULT_TEMPLATE_OPTIONS: RequiredTemplateOptions = {
    height: 1050,
    width: 750,
    color: rgbaToInt(255, 255, 255, 255),
};
