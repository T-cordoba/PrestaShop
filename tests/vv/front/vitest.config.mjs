import {fileURLToPath} from 'node:url';

const js = fileURLToPath(new URL('../../../admin-dev/themes/new-theme/js/', import.meta.url));

export default {
  resolve: {
    alias: {
      '@app': `${js}app`,
      '@components': `${js}components`,
      '@js': js.replace(/[\/]$/, ''),
      '@pages': `${js}pages`,
      '@PSTypes': `${js}@types`,
    },
  },
  test: {
    environment: 'jsdom',
    include: ['front/**/*.test.ts'],
    setupFiles: ['front/setup.ts'],
    restoreMocks: true,
  },
};
