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
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'LinguaFlowContent',
      formats: ['iife'],
      fileName: () => 'content/index.js',
    },
    rollupOptions: {
      output: {
        extend: true,
        assetFileNames: 'content/[name].[ext]',
      },
    },
  },
});
