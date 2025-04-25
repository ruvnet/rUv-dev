#!/usr/bin/env node

/**
 * MCP Wizard Demo Script
 * 
 * This script demonstrates how to use the MCP Configuration Wizard
 * programmatically in your own applications.
 */

const { run } = require('../src/cli');

// Example 1: Run the interactive wizard
async function runInteractiveWizard() {
  console.log('Running interactive wizard...');
  await run(['node', 'create-sparc', 'wizard']);
}

// Example 2: List configured servers
async function listServers() {
  console.log('Listing configured servers...');
  await run(['node', 'create-sparc', 'wizard', '--list']);
}

// Example 3: Add a server non-interactively
// Note: This requires all parameters to be provided
async function addServerNonInteractive() {
  console.log('Adding server non-interactively...');
  await run([
    'node', 
    'create-sparc', 
    'wizard', 
    '--add', 
    'openai',
    '--no-interactive',
    // In a real implementation, you would provide all required parameters
    // This is just a demonstration
  ]);
}

// Example 4: Remove a server
async function removeServer() {
  console.log('Removing server...');
  await run([
    'node', 
    'create-sparc', 
    'wizard', 
    '--remove', 
    'openai'
  ]);
}

// Example 5: Update a server
async function updateServer() {
  console.log('Updating server...');
  await run([
    'node', 
    'create-sparc', 
    'wizard', 
    '--update', 
    'openai'
  ]);
}

// Example 6: Use custom paths
async function useCustomPaths() {
  console.log('Using custom configuration paths...');
  await run([
    'node', 
    'create-sparc', 
    'wizard', 
    '--list',
    '--config-path', 
    'custom/path/mcp.json',
    '--roomodes-path',
    'custom/path/roomodes'
  ]);
}

// Example 7: Use custom registry
async function useCustomRegistry() {
  console.log('Using custom registry...');
  await run([
    'node', 
    'create-sparc', 
    'wizard',
    '--registry',
    'https://custom-registry.example.com/api'
  ]);
}

// Run the examples
async function runExamples() {
  try {
    // Uncomment the example you want to run
    await runInteractiveWizard();
    // await listServers();
    // await addServerNonInteractive();
    // await removeServer();
    // await updateServer();
    // await useCustomPaths();
    // await useCustomRegistry();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

runExamples();