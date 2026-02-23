const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'jsdom',
    include: ['apps/TextBoxGenerator/tests/unit/**/*.test.js'],
    exclude: ['apps/TextBoxGenerator/tests/e2e/**'],
  }
});
