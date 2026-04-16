import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@tanstack/react-query', 'axios'],
          'charts-vendor': ['recharts'],
          'ui-vendor': [
            'lucide-react',
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
            '@radix-ui/react-dialog',
          ],
        },
      },
    },
  },
})
