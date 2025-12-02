import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  // Expose non-VITE_ prefixed env variables to the app
  define: {
    'import.meta.env.GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.GOOGLE_MAPS_API_KEY),
    'import.meta.env.GOOGLE_MAPS_MAP_ID': JSON.stringify(process.env.GOOGLE_MAPS_MAP_ID)
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      // API proxy for backend microservices
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // Supabase Auth proxy (development only)
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      // Supabase REST proxy (development only)
      '/rest': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      // Supabase Storage proxy (development only)
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router'],
          'vendor-query': ['@tanstack/vue-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['bootstrap'],
          'html2canvas': ['html2canvas'],
          'canvas-confetti': ['canvas-confetti']
        }
      }
    },
    // Minification with terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,  // Temporarily enable console.log for debugging
        drop_debugger: true
      }
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', 'vue-router', '@tanstack/vue-query', '@supabase/supabase-js']
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  }
})