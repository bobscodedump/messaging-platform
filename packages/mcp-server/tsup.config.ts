import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    sourcemap: true,
    dts: true,
    splitting: false,
    minify: false,
    clean: true,
    target: 'es2021',
    platform: 'node'
});
