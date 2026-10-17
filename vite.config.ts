import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/real-estate-map-explorer/',

  build: {
    sourcemap: true,
  },

  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});