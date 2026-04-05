import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    environmentMatchGlobs: [
      ['electron/**/*.test.js', 'node'],
    ],
    include: [
      'src/**/*.test.{js,jsx}',
      'electron/**/*.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**', 'electron/**'],
      exclude: ['src/main.jsx', 'electron/main.js'],
    },
  },
})
