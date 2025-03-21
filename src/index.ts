import { Bundler } from './lib/bundler';
import { Template } from './lib/template';
import { toPoint, toSize } from './lib/types/2d';

type ExampleEntry = {
    title: string;
    subtitle: string;
    copies: string;
    effect: string;
};

(async () => {
    const result = await Template.new<ExampleEntry>({
        defaultFontFamily: 'branela',
        defaultAssetsPath: 'assets',
    })
        .textLayer(
            'title',
            {
                start: toPoint(25, 25),
                size: toSize(700, 700),
                textAlign: 'center',
            },
            {
                font: {
                    size: 48,
                    family: 'blackflag',
                },
            },
        )
        .font('assets/BlackFlag.ttf', 'blackflag')
        .textLayer(
            'subtitle',
            {
                start: toPoint(25, 125),
                size: toSize(700, 700),
                textAlign: 'center',
            },
            {
                font: {
                    size: 38,
                },
                color: 'purple',
            },
        )
        .font('assets/branela.otf', 'branela')
        .imageLayer(
            'title',
            {
                start: toPoint(25, 225),
                size: toSize(700, 700),
                scale: 'stretch',
            },
            {
                assetsPath: 'assets',
                pathFn: (title: string): string => `${title.toLowerCase()}.png`,
            },
        )
        .textLayer(
            'effect',
            {
                start: toPoint(125, 950),
                size: toSize(500, 150),
                textAlign: 'center',
            },
            {
                font: {
                    size: 32,
                },
            },
        )
        .fromCsv('assets/data.csv', {
            duplication: {
                countField: 'copies',
            },
        });

    await Promise.all(
        Bundler.new()
            .bundle(result)
            .map((r, index) => r.write(`assets/test-${index + 1}.png`)),
    );
})();
