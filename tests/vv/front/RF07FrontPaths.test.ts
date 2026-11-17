import {afterAll, describe, expect, it} from 'vitest';
import TableSorting from '@app/utils/table-sorting';
import {perf} from './perf';

const {$} = window;

function sortingUrl(colName: string, direction: string, prefix: string): URL {
  const sorting = new TableSorting($('<table id="manufacturer_grid_table"></table>')) as never as {
    getUrl(c: string, d: string, p: string): string
  };

  return new URL(sorting.getUrl(colName, direction, prefix));
}

describe('RF07FrontPaths: TableSorting.getUrl()', () => {
  it('testCamino1: without prefix sets orderBy and sortOrder', () => {
    const url = sortingUrl('name', 'asc', '');

    expect(url.searchParams.get('orderBy')).toBe('name');
    expect(url.searchParams.get('sortOrder')).toBe('asc');
    expect(url.hash).toBe('#manufacturer_grid_table');
  });

  it('testCamino2: with the manufacturer prefix sets manufacturer[orderBy] and manufacturer[sortOrder]', () => {
    const url = sortingUrl('name', 'desc', 'manufacturer');

    expect(url.searchParams.get('manufacturer[orderBy]')).toBe('name');
    expect(url.searchParams.get('manufacturer[sortOrder]')).toBe('desc');
    expect(url.searchParams.has('orderBy')).toBe(false);
    expect(url.hash).toBe('#manufacturer_grid_table');
  });

  afterAll(() => {
    const sorting = new TableSorting($('<table id="manufacturer_grid_table"></table>')) as never as {
      getUrl(c: string, d: string, p: string): string
    };
    perf('07', () => sorting.getUrl('name', 'desc', 'manufacturer'));
  });
});
