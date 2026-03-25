import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use absolute paths for web builds, relative for Capacitor
  base: process.env.CAPACITOR_BUILD === 'true' ? './' : '/',
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
      onwarn(warning, warn) {
        // Capacitor modules are intentionally used as both static and dynamic imports
        // (static for type/platform checks, dynamic for lazy native loading)
        if (warning.message?.includes('dynamic import will not move module into another chunk')) return;
        warn(warning);
      },
      output: {
        // Better chunking for iOS compatibility
        manualChunks(id) {
          if (id.includes('iosCompatibility') || id.includes('safetStorage')) {
            return 'ios-compat';
          }
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('react-router')) {
            return 'router';
          }
          if (id.includes('@radix-ui')) {
            return 'ui-components';
          }
        },
        // Ensure proper module format for iOS
        format: 'es',
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      },
    },
    // iOS-specific optimizations
    sourcemap: false, // Disable sourcemaps in production for iOS performance
    assetsInlineLimit: 4096, // Inline small assets
  },
  esbuild: {
    target: 'es2017', // iOS Safari 12+ support
    keepNames: true,
  },
}));
