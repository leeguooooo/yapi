import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-proposal-class-properties', { loose: true }]
      ]
    }
  })],
  
  root: 'client',
  
  resolve: {
    alias: {
      'client': path.resolve(__dirname, 'client'),
      'common': path.resolve(__dirname, 'common'), 
      'exts': path.resolve(__dirname, 'exts')
    }
  },
  
  server: {
    port: 4000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  
  build: {
    outDir: '../static/prd',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'client/index.jsx'
      }
    }
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "client/styles/mixin.scss";`
      },
      less: {
        javascriptEnabled: true
      }
    }
  }
})
