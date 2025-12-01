import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import * as sass from 'sass'
import { ViteMcp } from 'vite-plugin-mcp'

// Silence Dart Sass legacy API warnings until upstream tooling moves to the new API
process.env.SASS_SILENCE_DEPRECATIONS = 'legacy-js-api,import,slash-div'

const isProd = process.env.NODE_ENV === 'production'
const isMcpEnabled = process.env.MCP_ENABLED !== 'false'

export default defineConfig({
  plugins: [
    react({
      babel: {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { loose: true, modules: false }],
          ['@babel/preset-react', { runtime: 'automatic' }]
        ],
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }],
          ['@babel/plugin-proposal-object-rest-spread', { loose: true }]
        ]
      }
    }),
    !isProd && isMcpEnabled
      ? ViteMcp({
          // Avoid auto-updating editor configs; only expose MCP server at /__mcp/sse
          updateConfig: false
        })
      : null
  ].filter(Boolean),
  
  root: 'client',
  
  resolve: {
    alias: {
      'client': path.resolve(__dirname, 'client'),
      'common': path.resolve(__dirname, 'common'), 
      'exts': path.resolve(__dirname, 'exts')
    }
  },
  
  define: {
    global: 'window'
  },
  
  server: {
    host: '127.0.0.1',
    port: 4000,
    strictPort: true,
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

  esbuild: {
    jsx: 'transform',
    loader: 'jsx',
    include: /client\/.*\.[jt]sx?$/,
    exclude: []
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "client/styles/mixin.scss" as *;`,
        // silence Sass legacy warnings emitted by upstream render() API usage
        logger: sass.Logger.silent
      },
      less: {
        javascriptEnabled: true
      }
    }
  }
})
