import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

console.log('=== BUILD TIME ENV ===')
console.log('VITE_CLERK_PUBLISHABLE_KEY:', process.env.VITE_CLERK_PUBLISHABLE_KEY?.slice(0, 10))
console.log('All VITE_ vars:', Object.keys(process.env).filter(k => k.startsWith('VITE_')))
console.log('======================')

export default defineConfig(({ mode }) => {
  // Load env vars explicitly — critical for Cloudflare
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
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
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            convex: ['convex', 'convex/react'],
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
            ],
            dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
      // Explicitly inject Clerk key for production builds
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY),
      'import.meta.env.VITE_CONVEX_URL': JSON.stringify(env.VITE_CONVEX_URL),
    },
  }
})
