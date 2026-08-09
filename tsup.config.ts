import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/extensions/*.ts',
    "src/legacy/dialects/*.ts",
  ],
  format: ['esm', 'cjs'],
  cjsInterop: true,
  dts: true,
  sourcemap: true,
  clean: true,
  bundle: true,
  splitting: true,
  external: ['bun:test', 'jasmine', 'jest', 'mocha', 'chai', 'chai-spies', 'vitest', 'node:test'],
});
