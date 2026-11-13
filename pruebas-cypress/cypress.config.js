const { defineConfig } = require("cypress");

module.exports = defineConfig({
  video: true,
  defaultCommandTimeout: 90000,
  e2e: {
    baseUrl: "http://localhost:8080",
    setupNodeEvents(on, config) {},
  },
});