import { Jimp } from 'jimp';
import { Bundler } from './lib/bundler';
import { Replacement } from './lib/replacement';
import { Template } from './lib/template';
import { toPoint, toSize } from './lib/types/2d';
import { ImageType } from './lib/types/image';

type ExampleEntry = {
    title: string;
    subtitle: string;
    copies: string;
    effect: string;
};

(async () => {
    const fireball = await Jimp.read('assets/fireball.png');
    const result = await Template.new<ExampleEntry>({
        defaultFontFamily: 'branela',
        defaultAssetsPath: 'assets',
    })
        .text({
            key: 'title',
            position: {
                ...toPoint(25, 25),
                ...toSize(700, 700),
                textAlign: 'center',
            },
            options: {
                font: {
                    size: 48,
                    family: 'blackflag',
                },
            },
        })
        .font('assets/BlackFlag.ttf', 'blackflag')
        .text({
            key: 'subtitle',
            position: {
                ...toPoint(25, 125),
                ...toSize(700, 700),
                textAlign: 'center',
            },
            options: {
                font: {
                    size: 38,
                },
                color: 'purple',
            },
        })
        .font('assets/branela.otf', 'branela')
        .image({
            key: 'title',
            position: {
                ...toPoint(25, 225),
                ...toSize(700, 700),
                scale: 'stretch',
            },
            options: {
                assetsPath: 'assets',
                pathFn: (title: string): string => `${title.toLowerCase()}.png`,
            },
        })
        .text({
            key: 'effect',
            position: {
                ...toPoint(125, 950),
                ...toSize(500, 150),
                textAlign: 'center',
            },
            options: {
                font: {
                    size: 32,
                },
                replacement: new Replacement()
                    .replace(['Fireball'], fireball as ImageType)
                    .build(),
            },
        })
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
