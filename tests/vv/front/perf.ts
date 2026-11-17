import {mkdirSync, writeFileSync} from 'node:fs';
import {totalmem} from 'node:os';
import {join} from 'node:path';

// Same measures as the back path tests: CPU and wall time of n calls, process memory against total memory.
export function perf(rf: string, unit: () => void, calls = 2000): void {
  const cpu0 = process.cpuUsage();
  const t0 = performance.now();
  for (let i = 0; i < calls; i += 1) {
    unit();
  }
  const ttot = performance.now() - t0;
  const cpu = process.cpuUsage(cpu0);
  const result = {
    calls,
    tcpu: Math.round((cpu.user + cpu.system) / 100) / 10,
    ttot: Math.round(ttot * 10) / 10,
    mproc: Math.round(process.memoryUsage().rss / 1048576),
    mtot: Math.round(totalmem() / 1048576),
  };
  // Vitest runs from tests/vv; jsdom replaces the global URL, so plain paths are used.
  const dir = join(process.cwd(), 'reports', 'front');
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, `perf-RF${rf}.json`), JSON.stringify(result));
}
