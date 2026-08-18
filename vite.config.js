import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('pdfjs-dist') ||
              id.includes('@napi-rs') ||
              id.includes('canvas')
            ) {
              return 'pdf'
            }

            if (
              id.includes('@supabase') ||
              id.includes('supabase-js')
            ) {
              return 'supabase'
            }

            if (id.includes('react-router')) {
              return 'router'
            }

            if (id.includes('react') || id.includes('scheduler')) {
              return 'react'
            }

            if (id.includes('lucide-react')) {
              return 'icons'
            }

            return 'vendor'
          }
        },
      },
    },
  },
})
