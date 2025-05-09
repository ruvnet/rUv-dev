#!/usr/bin/env node

// This wrapper script redirects stdout to stderr to prevent
// protocol messages from interfering with MCP communication

// Save original stdout.write
const originalStdoutWrite = process.stdout.write;

// Redirect all stdout writes to stderr
process.stdout.write = function() {
  return process.stderr.write.apply(process.stderr, arguments);
};

// Run the actual server
require('./dist/index.js');