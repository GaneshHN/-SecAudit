import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // FastAPI backend (advanced scanning) — port 8000
      // MUST come before '/api' since '/api/v1' is more specific
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Node.js backend (repo/file scanning) — port 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
