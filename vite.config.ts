import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { generateServiceWorker } from './scripts/generate-sw'

export default defineConfig({
  base: './',
  plugins: [react(), generateServiceWorker('memory')],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
