import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
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
        drop_console: true,
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