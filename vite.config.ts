import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './', // Required for Capacitor - use relative paths for native apps
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: ['es2017', 'safari12'], // Support iOS Safari 12+
    modulePreload: { polyfill: true },
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Better chunking for iOS compatibility
        manualChunks: {
          'ios-compat': ['@/utils/iosCompatibility', '@/utils/safetStorage'],
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-components': ['@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-dropdown-menu'],
        },
        // Ensure proper module format for iOS
        format: 'es',
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      },
    },
    // iOS-specific optimizations
    sourcemap: false, // Disable sourcemaps in production for iOS performance
    assetsInlineLimit: 4096, // Inline small assets
  },
  esbuild: {
    target: 'es2017', // iOS Safari 12+ support
    supported: {
      'bigint': false, // Disable bigint for iOS compatibility
      'top-level-await': false, // Disable top-level await
    },
    // Ensure proper transformation of modern syntax
    keepNames: true,
  },
}));
