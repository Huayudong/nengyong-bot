/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // dist/index.html is loaded from file:// in Electron
  plugins: [react(), tailwindcss()],
  // Vite scans every .html for deps by default; design/ mockups import from a CDN importmap it cannot resolve
  optimizeDeps: { entries: ['index.html'] },
  test: { environment: 'jsdom', setupFiles: ['./src/testSetup.ts'] },
})
