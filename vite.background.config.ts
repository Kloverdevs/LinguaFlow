import { defineConfig } from 'vite';
import { resolve } from 'path';

const outDirName = process.env.TARGET === 'firefox' ? 'dist-firefox' : 'dist';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: resolve(__dirname, outDirName),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/background/index.ts'),
      formats: ['es'],
      fileName: () => 'background/index.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'background/index.js',
      },
    },
  },
});
