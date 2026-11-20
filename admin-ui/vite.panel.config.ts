import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Issue panel / glance / context bundle. Separate folder because Forge serves
// one Custom UI resource per directory.
export default defineConfig({
  root: 'panel',
  base: './',
  plugins: [react()],
  build: { outDir: '../dist-panel', emptyOutDir: true, assetsInlineLimit: 0, modulePreload: false },
});
