import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@config': path.resolve(__dirname, './src/config'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/generated': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
});
