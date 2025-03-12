import {Template} from './lib/template';
import {toPoint} from './lib/types';

type ExampleEntry = {
   name: string;
};

(async () => {
   const result = await Template.new<ExampleEntry>()
      .staticImageLayer('assets/luigi.png', {
         start: toPoint(25, 25),
         size: toPoint(400, 400),
      })
      .textLayer('name', {
         start: toPoint(25, 100),
         size: toPoint(400, 400),
      })
      .render({name: 'LUIGI'});

   await result.write('test.png');
})();
