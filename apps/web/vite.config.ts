import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@sanctuary/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@sanctuary/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@sanctuary/convex': path.resolve(__dirname, '../../packages/convex/src'),
    },
  },
  server: {
    port: 3000,
  },
})
