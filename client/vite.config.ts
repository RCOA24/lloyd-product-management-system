import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The proxy keeps local browser requests same-origin while the API runs on port 5240.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5240',
        changeOrigin: true,
      },
    },
  },
})
