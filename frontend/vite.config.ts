/**
 * Vite Configuration
 * 
 * Configuration for Vite build tool and development server.
 * Includes React plugin setup, proxy configuration, and build optimizations.
 * 
 * @author Tapish Bagdi
 * @version 1.0.0
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react({
        // Enable React Fast Refresh
        fastRefresh: true,
      }),
    ],

    // Development server configuration
    server: {
      port: 3001,
      host: true, // Listen on all addresses
      open: true, // Open browser automatically

      // Proxy API requests to backend
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: true,

      // Bundle splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // React and related packages
            react: ['react', 'react-dom', 'react-router-dom'],

            // Material-UI packages
            mui: ['@mui/material', '@mui/icons-material'],

            // Utility libraries
            utils: ['date-fns', 'axios'],

            // State management and queries
            state: ['@tanstack/react-query'],
          },
        },
      },

      // Optimize bundle size
      chunkSizeWarningLimit: 1000,
    },

    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
      },
    },

    // Environment variables
    define: {
      'process.env': env,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    // Testing configuration
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
    },

    // CSS configuration
    css: {
      devSourcemap: true,
    },

    // Performance optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        'axios',
        'date-fns',
      ],
    },
  };
});