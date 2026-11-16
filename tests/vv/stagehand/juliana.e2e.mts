import { act, assert, defineSuite, extract, goto, gridRows, pathOf, rejected, successFlash, tag, z } from './support/scenario.mjs';

defineSuite('juliana', 'Stagehand — Juliana Álvarez Arboleda (RF-01..RF-05)', [
  {
    id: 'STH-01-01', name: 'RF-01 exitoso: crear un impuesto con datos válidos',
    run: async (s) => {
      await goto(s, 'improve/international/taxes/new');
      await act(s, 'Type %name% into the "Name" text field', { name: tag('VV-STH IVA') });
      await act(s, 'Type 19 into the "Rate" text field');
      await act(s, 'Click the "Save" button');
      assert.match(await successFlash(s), /Successful creation/);
    },
  },
  {
    id: 'STH-01-02', name: 'RF-01 alternativo: impuesto exento (tasa 0) e inactivo',
    run: async (s) => {
      await goto(s, 'improve/international/taxes/new');
      await act(s, 'Type %name% into the "Name" text field', { name: tag('VV-STH Exento') });
      await act(s, 'Type 0 into the "Rate" text field');
      await act(s, 'Click the "Yes" switch next to "Enable" so that it becomes "No"');
      await act(s, 'Click the "Save" button');
      assert.match(await successFlash(s), /Successful creation/);
    },
  },
  {
    id: 'STH-01-03', name: 'RF-01 error: una tasa no numérica se rechaza',
    run: async (s) => {
      await goto(s, 'improve/international/taxes/new');
      await act(s, 'Type %name% into the "Name" text field', { name: tag('VV-STH Malo') });
      await act(s, 'Type abc into the "Rate" text field');
      await act(s, 'Click the "Save" button');
      await rejected(s, '/taxes/new');
    },
  },
  {
    id: 'STH-02-01', name: 'RF-02 exitoso: leer con IA la tasa de un impuesto del listado',
    run: async (s) => {
      await goto(s, 'improve/international/taxes/?tax[filters][name]=TVA FR 20');
      const data = await extract(s, 'From the taxes table, extract the rate of the tax named "TVA FR 20%"', z.object({ rate: z.number() }));
      assert.equal(data.rate, 20);
    },
  },
  {
    id: 'STH-02-02', name: 'RF-02 alternativo: abrir la edición desde el listado',
    run: async (s) => {
      await goto(s, 'improve/international/taxes/?tax[filters][name]=TVA FR 10');
      await act(s, 'Click on the row of the tax named "TVA FR 10%" in the taxes table to edit it');
      await new Promise((r) => setTimeout(r, 3000));
      assert.match(await pathOf(s), /\/taxes\/\d+\/edit/);
    },
  },
  {
    id: 'STH-02-03', name: 'RF-02 error: editar un impuesto inexistente',
    run: async (s) => {
      await goto(s, 'improve/international/taxes/999999/edit');
      const data = await extract(s, 'Extract the text of the error or warning message shown at the top of the page, if any', z.object({ message: z.string() }));
      assert.ok(!/internal server error/i.test(data.message));
      assert.ok(!(await pathOf(s)).includes('/999999/edit') || data.message.length > 0, 'no se informó el error');
    },
  },
  {
    id: 'STH-03-01', name: 'RF-03 exitoso: crear una zona',
    run: async (s) => {
      await goto(s, 'improve/international/zones/new');
      await act(s, 'Type %name% into the "Name" text field', { name: tag('VV-STH Andina') });
      await act(s, 'Click the "Save" button');
      assert.match(await successFlash(s), /Successful creation/);
    },
  },
  {
    id: 'STH-03-02', name: 'RF-03 alternativo: crear una zona inactiva',
    run: async (s) => {
      await goto(s, 'improve/international/zones/new');
      await act(s, 'Type %name% into the "Name" text field', { name: tag('VV-STH Inactiva') });
      await act(s, 'Click the "Yes" switch next to "Active" so that it becomes "No"');
      await act(s, 'Click the "Save" button');
      assert.match(await successFlash(s), /Successful creation/);
    },
  },
  {
    id: 'STH-03-03', name: 'RF-03 error: nombre con marcado HTML',
    run: async (s) => {
      await goto(s, 'improve/international/zones/new');
      await act(s, 'Type %name% into the "Name" text field', { name: '<b>VV</b>' });
      await act(s, 'Click the "Save" button');
      await rejected(s, '/zones/new');
    },
  },
  {
    id: 'STH-04-01', name: 'RF-04 exitoso: ubicar con IA una zona en el listado',
    run: async (s) => {
      await goto(s, 'improve/international/zones/?zone[filters][name]=Europe');
      const data = await extract(s, 'Extract the names of all zones listed in the zones table', z.object({ names: z.array(z.string()) }));
      assert.ok(data.names.some((n) => n.includes('Europe')));
    },
  },
  {
    id: 'STH-04-02', name: 'RF-04 alternativo: abrir y cancelar el borrado de una zona',
    run: async (s) => {
      await goto(s, 'improve/international/zones/?zone[filters][name]=VV-STH Inactiva');
      const before = await gridRows(s, 'zone');
      await act(s, 'Click the three dots dropdown button at the end of the first row of the zones table');
      await act(s, 'Click "Delete" in the opened dropdown menu');
      await act(s, 'Click the "Cancel" button of the confirmation dialog');
      await new Promise((r) => setTimeout(r, 1500));
      assert.deepEqual(await gridRows(s, 'zone'), before);
    },
  },
  {
    id: 'STH-04-03', name: 'RF-04 error: el filtro sin coincidencias no muestra filas',
    run: async (s) => {
      await goto(s, 'improve/international/zones/?zone[filters][name]=zzzz-no-existe');
      const data = await extract(s, 'Does the zones table say that no records were found? Answer with empty=true or false', z.object({ empty: z.boolean() }));
      assert.equal(data.empty, true);
    },
  },
  {
    id: 'STH-05-01', name: 'RF-05 exitoso: crear un país',
    run: async (s) => {
      await goto(s, 'improve/international/countries/new');
      await act(s, 'Type %name% into the "Country" name text field', { name: tag('VV-STH Patria') });
      await act(s, 'Type QC into the "ISO code" text field');
      await act(s, 'Type 57 into the "Call prefix" field');
      await act(s, 'Select "South America" in the "Zone" dropdown');
      await act(s, 'Click the "Save" button');
      assert.match(await successFlash(s), /Successful creation/);
    },
  },
  {
    id: 'STH-05-02', name: 'RF-05 alternativo: leer con IA la zona de un país existente',
    run: async (s) => {
      await goto(s, 'improve/international/countries/?country[filters][name]=Colombia');
      const data = await extract(s, 'From the countries table, extract the zone of the country named "Colombia"', z.object({ zone: z.string() }));
      assert.match(data.zone, /South America/i);
    },
  },
  {
    id: 'STH-05-03', name: 'RF-05 error: código ISO con dígitos',
    run: async (s) => {
      await goto(s, 'improve/international/countries/new');
      await act(s, 'Type %name% into the "Country" name text field', { name: tag('VV-STH ISO') });
      await act(s, 'Type X1 into the "ISO code" text field');
      await act(s, 'Type 57 into the "Call prefix" field');
      await act(s, 'Click the "Save" button');
      await rejected(s, '/countries/new');
    },
  },
]);
