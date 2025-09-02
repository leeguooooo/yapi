import { defineConfig } from 'vite'

export default defineConfig({
  root: 'client',
  server: {
    port: 4000
  },
  resolve: {
    alias: {
      'client': '/Users/leo/github.com/yapi/client',
      'common': '/Users/leo/github.com/yapi/common',
      'exts': '/Users/leo/github.com/yapi/exts'
    }
  }
})