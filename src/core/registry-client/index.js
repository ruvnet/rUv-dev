/**
 * Registry Client Module
 * 
 * This module exports the Registry Client and related utilities.
 */

const RegistryClient = require('./registry-client');
const MockRegistryClient = require('./mock-registry-client');
const RegistryError = require('./registry-error');

module.exports = {
  RegistryClient,
  MockRegistryClient,
  RegistryError
};