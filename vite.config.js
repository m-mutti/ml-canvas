import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'
  
  return {
    plugins: [
      vue(),
      vueJsx(),
      !isLib && vueDevTools(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    build: isLib ? {
      lib: {
        entry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/components/MLCanvas.vue'),
        name: 'MLCanvas',
        fileName: (format) => `ml-canvas.${format}.js`
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue'
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'ml-canvas.css'
            return assetInfo.name
          }
        }
      },
      cssCodeSplit: false,
      copyPublicDir: false
    } : undefined
  }
})
