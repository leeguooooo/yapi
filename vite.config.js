import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import * as sass from 'sass'

// Silence Dart Sass legacy API warnings until upstream tooling moves to the new API
process.env.SASS_SILENCE_DEPRECATIONS = 'legacy-js-api,import,slash-div'

const isProd = process.env.NODE_ENV === 'production'
const isMcpEnabled = process.env.MCP_ENABLED !== 'false'

export default defineConfig(async () => {
  const plugins = [
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
    })
  ];

  if (!isProd && isMcpEnabled) {
    const { ViteMcp } = await import('vite-plugin-mcp');
    plugins.push(
      ViteMcp({
        // Avoid auto-updating editor configs; only expose MCP server at /__mcp/sse
        updateConfig: false
      })
    );
  }

  return {
    plugins,

    root: 'client',

    resolve: {
      alias: {
        'client': path.resolve(__dirname, 'client'),
        'common': path.resolve(__dirname, 'common'),
        'exts': path.resolve(__dirname, 'exts'),
        // Shim legacy withRouter usage onto react-router-dom v7
        'react-router-dom': path.resolve(__dirname, 'client/shims/react-router-dom.js'),
        'common/postmanLib.js': path.resolve(__dirname, 'client/shims/postmanLib.js')
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
      jsx: 'automatic',
      loader: 'jsx'
    },

    optimizeDeps: {
      // A large chunk of legacy code lives in `.js` files that actually contain JSX.
      // Force the dep scanner to parse them as JSX to avoid "JSX syntax extension not enabled" errors.
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        },
        jsx: 'automatic'
      }
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
  };
});
