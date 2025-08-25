import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
  },
  build: {
    target: 'es2015', // Support older iOS Safari versions
    polyfillModulePreload: false,
    minify: 'terser',
    terserOptions: {
      safari10: true, // Ensure Safari 10 compatibility
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate iOS-critical modules
          'ios-compat': ['@/utils/iosCompatibility', '@/utils/safetStorage'],
        },
      },
    },
  },
  esbuild: {
    target: 'es2015', // Ensures compatibility with iOS Safari 10.3+
    supported: {
      'bigint': false, // Disable bigint for older iOS
    },
  },
}));
