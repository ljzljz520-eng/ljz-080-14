import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 本地开发时将 API 代理到 NestJS 后端
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          antd: ['antd'],
          'antd-mobile': ['antd-mobile', 'antd-mobile-icons'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
