import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    test: {
      globals: true,
      environment: 'jsdom',
      env,
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
