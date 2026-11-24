import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'

// Main + preload bundled to CommonJS for Electron. Dependencies are inlined, so the app needs no node_modules at runtime.
export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
    target: 'node22',
    minify: false,
    sourcemap: true,
    ssr: true,
    rollupOptions: {
      input: { main: 'electron/main.ts', preload: 'electron/preload.ts' },
      external: ['electron', ...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
      output: { format: 'cjs', entryFileNames: '[name].cjs' },
    },
  },
  ssr: { noExternal: true },
})
