import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig(() => {
  return {
    test: {
      globals: true,
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Treat playwright as external — not available in test/serverless env, dynamic import fails gracefully at runtime
    optimizeDeps: {
      exclude: ['playwright'],
    },
    ssr: {
      external: ['playwright'],
    },
  };
})
