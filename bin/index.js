#!/usr/bin/env node

/**
 * create-sparc
 * NPX package to scaffold new projects with SPARC methodology structure
 */

// Set up error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('An unexpected error occurred:');
  console.error(error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Import and run the CLI
require('../src/cli')
  .run(process.argv)
  .catch((error) => {
    console.error('Failed to execute command:');
    console.error(error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  });