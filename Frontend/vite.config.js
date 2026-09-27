import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'markdown-vendor': ['markdown-to-jsx', 'highlight.js'],
          'http-vendor': ['axios', 'socket.io-client'],
          'container-vendor': ['@webcontainer/api'],
        },
      },
    },
  },
  server: {
    host: true, // Crucial for Docker port mapping
    port: 5173,
    watch: {
      usePolling: true // Helps hot-reload work smoothly inside containers
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/cdn': {
        target: 'https://unpkg.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn/, ''),
      },
    },
  },
})
