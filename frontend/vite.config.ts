import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url'
import react from '@vitejs/plugin-react-swc'
// import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
const NODE_ENV = process.env.NODE_ENV === 'development'
export default defineConfig({
  plugins: [
    react(),
    // viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    // viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url))
      },
      {
        find: '@wailsjs',
        replacement: fileURLToPath(new URL('./bindings/alemonapp/src', import.meta.url))
      }
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  esbuild: {
    drop: NODE_ENV ? [] : ['console', 'debugger']
  },
  build: {
    sourcemap: NODE_ENV, // 仅开发环境生成 sourcemap
    cssCodeSplit: true, // 开启 CSS 代码分割
    emptyOutDir: true, // 自动清理 dist
    commonjsOptions: {
      transformMixedEsModules: true
    },
    minify: 'terser',
    terserOptions: {
      compress: NODE_ENV
        ? {}
        : {
          drop_console: true,
          drop_debugger: true
        }
    },
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        webview: fileURLToPath(new URL('./index.webview.html', import.meta.url))
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(css)$/.test(name ?? '')) return 'css/[name]-[hash][extname]'
          return 'assets/[name]-[hash][extname]'
        },
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'react-router',
            'react-redux',
            'redux'
          ]
        }
      }
    }
  }
})
