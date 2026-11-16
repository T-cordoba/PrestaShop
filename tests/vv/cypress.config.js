const fs = require('fs');
const path = require('path');
const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');

// .env is local only (credentials); variables reach the specs through Cypress.env().
function readEnv() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
}

module.exports = defineConfig({
  e2e: {
    baseUrl: readEnv().BASE_URL || 'http://localhost:8001',
    specPattern: ['cypress/e2e/**/*.feature', 'cypress/blackbox/**/*.cy.js', 'cypress/a11y/**/*.cy.js', 'cypress/security/**/*.cy.js', 'cypress/explore/**/*.cy.js'],
    env: readEnv(),
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 180000,
    requestTimeout: 60000,
    responseTimeout: 180000,
    video: false,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: false,
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }));
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        // Precondition data the BO/API cannot create directly (e.g. a product linked to a supplier).
        sql(query) {
          const { execFileSync } = require('child_process');
          return execFileSync('docker', ['exec', 'prestashop-mysql-1', 'mysql', '-uroot', '-pprestashop', 'prestashop', '-N', '-e', query], { encoding: 'utf8' })
            .split('\n')
            .filter(Boolean);
        },
      });
      return config;
    },
  },
});
