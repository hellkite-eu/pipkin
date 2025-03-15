import {Template} from './lib/template';
import {toPoint, toSize} from './lib/types';

type ExampleEntry = {
   name: string;
};

(async () => {
   const result = await Template.new<ExampleEntry>()
      .staticImageLayer('assets/luigi.png', {
         start: toPoint(25, 150),
         size: toSize(700, 700),
         scale: 'stretch'
      })
      .textLayer('name', {
         anchor: toPoint(375, 100),
         alignment: 'center',
         baseline: 'top',
         maxWidth: 700,
      }, {
         font: {
            size: { px: 44 }
         }
      })
      .debug()
      .render({name: 'LUIGI LUIGI LUIGI'});

   await result.write('test.png');
})();
