import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Different environments per folder
    environmentMatchGlobs: [
      ['tests/renderer/**', 'jsdom'],
      ['tests/main/**', 'node'],
    ],
    setupFiles: ['tests/setup/patch-node-modules.cjs', 'tests/setup/global.setup.js'],
    // Ensure CSS modules don't break in tests
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // Don't reset mocks automatically — each test file sets up its own mocks
    clearMocks: true,
    // Aliases applied inside the test runner (affects both import and require)
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      // Stub electron and electron-store so CJS source files get the mocks.
      // vi.mock() alone can't intercept require() in CJS files that use pure-ESM
      // packages (electron-store@10 is pure ESM). Using test.alias is reliable.
      'electron': path.resolve(__dirname, 'tests/setup/electron.stub.js'),
      'electron-store': path.resolve(__dirname, 'tests/setup/electron-store.stub.js'),
    },
  },
})
