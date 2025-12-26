import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import * as sass from 'sass'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

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
        'common/postmanLib.js': path.resolve(__dirname, 'common/postmanLib.browser.js'),
        'common/postmanLib': path.resolve(__dirname, 'common/postmanLib.browser.js'),
        'common/utils': path.resolve(__dirname, 'common/utils.browser.js'),
        'common/utils.js': path.resolve(__dirname, 'common/utils.browser.js'),
        'common/HandleImportData.js': path.resolve(__dirname, 'client/shims/HandleImportData.browser.js'),
        '/@fs/Users/leo/github.com/yapi/common/HandleImportData.js': path.resolve(
          __dirname,
          'client/shims/HandleImportData.browser.js'
        ),
        'common/power-string.js': path.resolve(__dirname, 'common/power-string.browser.js'),
        'common/power-string': path.resolve(__dirname, 'common/power-string.browser.js')
      }
    },

    define: {
      global: 'window',
      'process.env': {
        version: pkg.version
      }
    },

    server: {
      host: '127.0.0.1',
      port: 4000,
      strictPort: true,
      fs: {
        // allow transforming shared server-side utilities referenced from client
        allow: [__dirname]
      },
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
        },
        output: {
          entryFileNames: 'assets/main.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: chunkInfo => {
            const ext = chunkInfo.name?.split('.').pop();
            if (ext === 'css') return 'assets/main.css';
            return 'assets/[name][extname]';
          }
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
