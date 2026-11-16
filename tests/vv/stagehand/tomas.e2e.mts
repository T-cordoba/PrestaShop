import { act, assert, defineSuite, extract, goto, gridRows, pathOf, rejected, successFlash, tag, z } from './support/scenario.mjs';

defineSuite('tomas', 'Stagehand — Tomás Córdoba Urquijo (RF-06..RF-10)', [
  {
    id: 'STH-06-01', name: 'RF-06 exitoso: crear una marca',
    run: async (s) => {
      await goto(s, 'sell/catalog/brands/new');
      await act(s, 'Type %name% into the "Name" text field', { name: tag('VV-STH Andes') });
      await act(s, 'Click the "Save" button at the bottom of the form');
      assert.match(await successFlash(s), /Successful creation/);
    },
  },
  {
    id: 'STH-06-02', name: 'RF-06 alternativo: crear una marca inactiva',
    run: async (s) => {
      await goto(s, 'sell/catalog/brands/new');
      await act(s, 'Type %name% into the "Name" text field', { name: tag('VV-STH Inactiva') });
      await act(s, 'Click the "Yes" switch next to "Enabled" so that it becomes "No"');
      await act(s, 'Click the "Save" button at the bottom of the form');
      assert.match(await successFlash(s), /Successful creation/);
    },
  },
  {
    id: 'STH-06-03', name: 'RF-06 error: nombre con caracteres prohibidos',
    run: async (s) => {
      await goto(s, 'sell/catalog/brands/new');
      await act(s, 'Type %name% into the "Name" text field', { name: 'Marca<>' });
      await act(s, 'Click the "Save" button at the bottom of the form');
      await rejected(s, '/brands/new');
    },
  },
  {
    id: 'STH-07-01', name: 'RF-07 exitoso: filtrar marcas por nombre con IA',
    run: async (s) => {
      await goto(s, 'sell/catalog/brands/');
      await act(s, 'Type "Studio" into the "Search name" filter field of the brands table');
      await act(s, 'Click the "Search" button of the brands table');
      await new Promise((r) => setTimeout(r, 2500));
      const rows = await gridRows(s, 'manufacturer');
      assert.ok(rows.length >= 1 && rows.every((r) => /Studio/i.test(r)), `filas: ${rows.join(' | ')}`);
    },
  },
  {
    id: 'STH-07-02', name: 'RF-07 alternativo: leer con IA el número de productos de una marca',
    run: async (s) => {
      await goto(s, 'sell/catalog/brands/?manufacturer[filters][name]=Studio Design');
      const data = await extract(s, 'From the brands table, extract the number in the "Products" column for the brand "Studio Design"', z.object({ products: z.number() }));
      const rows = await gridRows(s, 'manufacturer');
      assert.ok(rows[0]?.includes(String(data.products)), `la IA leyó ${data.products}; fila: ${rows[0]}`);
    },
  },
  {
    id: 'STH-07-03', name: 'RF-07 error: un comodín no debe devolver todas las marcas',
    run: async (s) => {
      await goto(s, 'sell/catalog/brands/?manufacturer[filters][name]=%25');
      const rows = (await gridRows(s, 'manufacturer')).filter((r) => !/No records found/i.test(r));
      assert.equal(rows.length, 0, `el filtro «%» devolvió ${rows.length} marcas`);
    },
  },
  {
    id: 'STH-08-01', name: 'RF-08 exitoso: desactivar un proveedor con IA',
    run: async (s) => {
      await goto(s, 'sell/catalog/suppliers/?supplier[filters][name]=Accessories supplier');
      const before = await s.page.evaluate(() => (document.querySelector('#supplier_grid_table tbody tr input[id^="input-true"]') as HTMLInputElement | null)?.checked);
      await act(s, 'Click the "Enabled" toggle switch in the first row of the suppliers table');
      assert.match(await successFlash(s), /successfully updated/i);
      const after = await s.page.evaluate(() => (document.querySelector('#supplier_grid_table tbody tr input[id^="input-true"]') as HTMLInputElement | null)?.checked);
      assert.notEqual(after, before);
    },
  },
  {
    id: 'STH-08-02', name: 'RF-08 alternativo: volver a activarlo',
    run: async (s) => {
      await goto(s, 'sell/catalog/suppliers/?supplier[filters][name]=Accessories supplier');
      await act(s, 'Click the "Enabled" toggle switch in the first row of the suppliers table');
      assert.match(await successFlash(s), /successfully updated/i);
    },
  },
  {
    id: 'STH-08-03', name: 'RF-08 error: la URL del interruptor sin token no cambia nada',
    run: async (s) => {
      await goto(s, 'sell/catalog/suppliers/?supplier[filters][name]=Accessories supplier');
      const before = await gridRows(s, 'supplier');
      await s.page.goto(`${new URL(await s.page.url()).origin}/admin-dev/index.php/sell/catalog/suppliers/2/toggle-status`);
      await goto(s, 'sell/catalog/suppliers/?supplier[filters][name]=Accessories supplier');
      assert.deepEqual(await gridRows(s, 'supplier'), before);
    },
  },
  {
    id: 'STH-09-01', name: 'RF-09 exitoso: leer con IA los proveedores del listado',
    run: async (s) => {
      await goto(s, 'sell/catalog/suppliers/');
      const data = await extract(s, 'Extract the names of all suppliers listed in the suppliers table', z.object({ names: z.array(z.string()) }));
      assert.ok(data.names.some((n) => /Fashion supplier/i.test(n)), data.names.join(', '));
    },
  },
  {
    id: 'STH-09-02', name: 'RF-09 alternativo: abrir y cancelar el borrado de un proveedor',
    run: async (s) => {
      await goto(s, 'sell/catalog/suppliers/?supplier[filters][name]=Fashion supplier');
      const before = await gridRows(s, 'supplier');
      await act(s, 'Click the three dots dropdown button at the end of the first row of the suppliers table');
      await act(s, 'Click "Delete" in the opened dropdown menu');
      await act(s, 'Click the "Cancel" button of the confirmation dialog');
      await new Promise((r) => setTimeout(r, 1500));
      assert.deepEqual(await gridRows(s, 'supplier'), before);
    },
  },
  {
    id: 'STH-09-03', name: 'RF-09 error: un proveedor inexistente no se puede editar',
    run: async (s) => {
      await goto(s, 'sell/catalog/suppliers/999999/edit');
      const text = await s.page.evaluate(() => document.body.innerText);
      assert.ok(!/internal server error/i.test(text));
      assert.ok(!(await pathOf(s)).includes('/999999/edit') || /not found|does not exist|cannot be found/i.test(text));
    },
  },
  {
    id: 'STH-10-01', name: 'RF-10 exitoso: agregar un valor a una característica',
    run: async (s) => {
      await goto(s, 'sell/catalog/features/new-value');
      await act(s, 'Type %value% into the "Value" text field', { value: tag('VV-STH Algodón') });
      await act(s, 'Click the "Save" button');
      assert.match(await successFlash(s), /Successful creation/);
    },
  },
  {
    id: 'STH-10-02', name: 'RF-10 alternativo: leer con IA los valores de la característica Composition',
    run: async (s) => {
      await goto(s, 'sell/catalog/features/1/values');
      const data = await extract(s, 'Extract the list of feature values shown in the table', z.object({ values: z.array(z.string()) }));
      assert.ok(data.values.some((v) => /Cotton/i.test(v)), data.values.join(', '));
    },
  },
  {
    id: 'STH-10-03', name: 'RF-10 error: un valor con marcado se rechaza',
    run: async (s) => {
      await goto(s, 'sell/catalog/features/new-value');
      await act(s, 'Type %value% into the "Value" text field', { value: 'Lana<b>' });
      await act(s, 'Click the "Save" button');
      await rejected(s, '/new-value');
    },
  },
]);
