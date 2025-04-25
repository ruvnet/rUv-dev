/**
 * Main entry point for create-sparc
 */

const { run } = require('./cli');
const { RegistryClient, RegistryError } = require('./core/registry-client');
const { mcpWizard, configGenerator } = require('./core/mcp-wizard');

module.exports = {
  run,
  RegistryClient,
  RegistryError,
  mcpWizard,
  configGenerator
};