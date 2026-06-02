import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tutorialApiTarget = env.TUTORIAL_API_PROXY_TARGET || 'http://localhost:8787'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: tutorialApiTarget,
          changeOrigin: true,
        },
        '/model': {
          target: tutorialApiTarget,
          changeOrigin: true,
        },
        '/output': {
          target: tutorialApiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
