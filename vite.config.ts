import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/cwc': {
        target: 'https://india-water.gov.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cwc/, ''),
      },
    },
  },
})
