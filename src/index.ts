import {Template} from './lib/template';
import {toPoint} from './lib/types';

type ExampleEntry = {};

(async () => {
   const result = await Template.new<ExampleEntry>()
      .staticImageLayer('assets/luigi.png', {anchorPoint: toPoint(100, 100)})
      .render({});

   // const image = await Jimp.read('assets/luigi.png');
   await result.write('test.png');
})();
