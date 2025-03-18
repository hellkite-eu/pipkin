import { Template } from './lib/template';
import { toPoint, toSize } from './lib/types/2d';

type ExampleEntry = {
    title: string;
    subtitle: string;
    copies: string;
};

(async () => {
    const result = await Template.new<ExampleEntry>({
        defaultFontFamily: 'branela',
        defaultAssetsPath: 'assets',
    })
        .textLayer(
            'title',
            {
                anchor: toPoint(375, 25),
                alignment: 'center',
                baseline: 'top',
                maxWidth: 700,
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
                anchor: toPoint(375, 125),
                alignment: 'center',
                baseline: 'top',
                maxWidth: 700,
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
        .fromCsv('assets/data.csv', {
            duplication: {
                countField: 'copies',
            },
        });

    await Promise.all(
        result.map((r, index) => r.write(`assets/test-${index + 1}.png`)),
    );
})();
