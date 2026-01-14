import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/', 'dist/', 'workers/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/stores/**/*.ts',
        'src/utils/**/*.ts',
        'src/types/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'workers/',
        'dist/',
        'scripts/',
        'src/components/**', // Components require integration tests
        'src/hooks/**', // Hooks require integration tests
        'src/services/**', // Services require integration tests
        'src/App.tsx',
        'src/main.tsx',
      ],
      thresholds: {
        // Thresholds for covered files only
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    reporters: ['default', 'html'],
    outputFile: {
      html: './tests/reports/index.html',
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
