/**
 * MCP Configuration Wizard File Manager Demo
 * 
 * This example demonstrates the key features of the File Manager component
 * for handling MCP configuration files safely.
 */

const path = require('path');
const { fileManager } = require('../src/core/file-manager');
const { logger } = require('../src/utils');

// Set logger to verbose mode
logger.setLevel('verbose');

/**
 * Demonstrates safe configuration file operations
 */
async function demonstrateConfigOperations() {
  console.log('\n=== DEMONSTRATING SAFE CONFIGURATION OPERATIONS ===\n');
  
  // Create a test configuration directory
  const configDir = path.join(__dirname, 'temp-config');
  await fileManager.createDirectory(configDir);
  console.log(`Created test directory: ${configDir}`);
  
  // Create a sample MCP configuration
  const configPath = path.join(configDir, 'mcp.json');
  const initialConfig = {
    version: '1.0.0',
    name: 'example-mcp-config',
    roomodes: {
      enabled: true,
      paths: ['.roomodes', '.roo']
    },
    features: {
      typescript: false,
      testing: true
    },
    dependencies: {
      required: ['fs-extra', 'chalk'],
      optional: ['lodash']
    }
  };
  
  // Write the initial configuration
  console.log('Writing initial configuration...');
  await fileManager.safeWriteConfig(configPath, initialConfig);
  console.log('Initial configuration written successfully');
  
  // Read the configuration back
  console.log('Reading configuration...');
  const readConfig = await fileManager.safeReadConfig(configPath);
  console.log('Configuration read successfully:');
  console.log(JSON.stringify(readConfig, null, 2));
  
  // Update the configuration with new values
  console.log('\nUpdating configuration...');
  const updates = {
    version: '1.1.0',
    features: {
      typescript: true,
      linting: true
    },
    dependencies: {
      required: ['fs-extra', 'chalk', 'inquirer']
    }
  };
  
  // Create a working copy for safe editing
  console.log('Creating temporary working copy...');
  const tempPath = await fileManager.createTempWorkingCopy(configPath);
  console.log(`Working copy created at: ${tempPath}`);
  
  // Read the working copy
  const workingConfig = await fileManager.safeReadConfig(tempPath);
  
  // Merge configurations
  console.log('Merging configurations...');
  const mergedConfig = fileManager.mergeConfigurations(workingConfig, updates, {
    strategy: 'deep'
  });
  
  // Write the merged config to the working copy
  await fileManager.writeFile(tempPath, JSON.stringify(mergedConfig, null, 2));
  
  // Commit the changes back to the original file
  console.log('Committing changes...');
  const commitResult = await fileManager.commitWorkingCopy(tempPath, configPath);
  console.log(`Changes committed successfully. Backup created at: ${commitResult.backupPath}`);
  
  // Read the updated configuration
  console.log('\nReading updated configuration...');
  const updatedConfig = await fileManager.safeReadConfig(configPath);
  console.log('Updated configuration:');
  console.log(JSON.stringify(updatedConfig, null, 2));
  
  // Find all backups
  console.log('\nFinding backups...');
  const backups = await fileManager.findBackups(configPath);
  console.log(`Found ${backups.length} backups:`);
  for (const backup of backups) {
    console.log(`- ${path.basename(backup)}`);
  }
  
  // Demonstrate restoring from backup
  if (backups.length > 0) {
    console.log('\nRestoring from most recent backup...');
    const mostRecentBackup = backups[0];
    const restoredPath = path.join(configDir, 'restored-mcp.json');
    await fileManager.restoreFromBackup(mostRecentBackup, restoredPath);
    console.log(`Restored to: ${restoredPath}`);
    
    // Read the restored configuration
    const restoredConfig = await fileManager.safeReadConfig(restoredPath);
    console.log('Restored configuration:');
    console.log(JSON.stringify(restoredConfig, null, 2));
  }
  
  return configDir;
}

/**
 * Demonstrates configuration merging strategies
 */
async function demonstrateMergeStrategies() {
  console.log('\n=== DEMONSTRATING CONFIGURATION MERGE STRATEGIES ===\n');
  
  const baseConfig = {
    version: '1.0.0',
    name: 'base-config',
    settings: {
      theme: 'dark',
      notifications: true,
      logging: false
    },
    features: ['a', 'b', 'c'],
    advanced: {
      debug: false,
      experimental: {
        enabled: false,
        options: {}
      }
    }
  };
  
  const newConfig = {
    version: '1.1.0',
    settings: {
      theme: 'light',
      performance: 'high'
    },
    features: ['b', 'd', 'e'],
    advanced: {
      debug: true,
      experimental: {
        enabled: true,
        options: {
          newFeature: true
        }
      }
    }
  };
  
  // Demonstrate shallow merge
  console.log('Shallow merge:');
  const shallowMerged = fileManager.mergeConfigurations(baseConfig, newConfig, {
    strategy: 'shallow'
  });
  console.log(JSON.stringify(shallowMerged, null, 2));
  
  // Demonstrate deep merge
  console.log('\nDeep merge:');
  const deepMerged = fileManager.mergeConfigurations(baseConfig, newConfig, {
    strategy: 'deep'
  });
  console.log(JSON.stringify(deepMerged, null, 2));
  
  // Demonstrate overwrite
  console.log('\nOverwrite:');
  const overwriteMerged = fileManager.mergeConfigurations(baseConfig, newConfig, {
    strategy: 'overwrite'
  });
  console.log(JSON.stringify(overwriteMerged, null, 2));
  
  // Demonstrate selective merge
  console.log('\nSelective merge (only "settings" and "advanced"):');
  const selectiveMerged = fileManager.mergeConfigurations(baseConfig, newConfig, {
    strategy: 'selective',
    selectiveKeys: ['settings', 'advanced']
  });
  console.log(JSON.stringify(selectiveMerged, null, 2));
}

/**
 * Demonstrates file integrity verification
 */
async function demonstrateFileIntegrity(configDir) {
  console.log('\n=== DEMONSTRATING FILE INTEGRITY VERIFICATION ===\n');
  
  const filePath = path.join(configDir, 'integrity-test.json');
  const content = {
    sensitive: true,
    apiKey: 'test-api-key-12345',
    secret: 'this-is-a-test-secret'
  };
  
  // Write the file
  console.log(`Writing sensitive file to: ${filePath}`);
  await fileManager.writeFile(filePath, JSON.stringify(content, null, 2));
  
  // Calculate file hash
  console.log('Calculating file hash...');
  const hash = await fileManager.calculateFileHash(filePath, { algorithm: 'sha256' });
  console.log(`File hash (SHA-256): ${hash}`);
  
  // Verify file integrity (should be true)
  console.log('Verifying file integrity...');
  const isIntact = await fileManager.verifyFileIntegrity(filePath, hash, { algorithm: 'sha256' });
  console.log(`File integrity check: ${isIntact ? 'PASSED' : 'FAILED'}`);
  
  // Modify the file
  console.log('\nModifying file...');
  const modifiedContent = {
    ...content,
    apiKey: 'modified-api-key',
    tampered: true
  };
  await fileManager.writeFile(filePath, JSON.stringify(modifiedContent, null, 2));
  
  // Verify file integrity again (should be false)
  console.log('Verifying file integrity after modification...');
  const isStillIntact = await fileManager.verifyFileIntegrity(filePath, hash, { algorithm: 'sha256' });
  console.log(`File integrity check: ${isStillIntact ? 'PASSED' : 'FAILED'}`);
}

/**
 * Demonstrates permission validation
 */
async function demonstratePermissionValidation(configDir) {
  console.log('\n=== DEMONSTRATING PERMISSION VALIDATION ===\n');
  
  const filePath = path.join(configDir, 'permissions-test.json');
  
  // Write a test file
  await fileManager.writeFile(filePath, JSON.stringify({ test: true }, null, 2));
  
  // Validate permissions
  console.log(`Validating permissions for: ${filePath}`);
  const permissionResult = await fileManager.validatePermissions(filePath, {
    read: true,
    write: true,
    execute: false
  });
  
  console.log('Permission validation result:');
  console.log(JSON.stringify(permissionResult, null, 2));
  
  if (permissionResult.valid) {
    console.log('File has all required permissions');
  } else {
    console.log('File is missing some required permissions');
  }
}

/**
 * Clean up test files
 */
async function cleanup(configDir) {
  console.log('\n=== CLEANING UP ===\n');
  
  console.log(`Removing test directory: ${configDir}`);
  await fileManager.delete(configDir, { recursive: true });
  console.log('Cleanup complete');
}

/**
 * Run the demo
 */
async function runDemo() {
  try {
    console.log('MCP Configuration Wizard File Manager Demo');
    console.log('=========================================');
    
    const configDir = await demonstrateConfigOperations();
    await demonstrateMergeStrategies();
    await demonstrateFileIntegrity(configDir);
    await demonstratePermissionValidation(configDir);
    await cleanup(configDir);
    
    console.log('\nDemo completed successfully!');
  } catch (error) {
    console.error('Demo failed with error:');
    console.error(error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };