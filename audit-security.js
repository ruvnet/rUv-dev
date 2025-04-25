#!/usr/bin/env node

/**
 * MCP Security Audit Script
 * Performs a security audit on the MCP configuration
 */

const path = require('path');
const { mcpWizard } = require('./src/core/mcp-wizard');

async function runAudit() {
  try {
    console.log('Performing MCP configuration security audit...');
    
    // Initialize the wizard
    await mcpWizard.initialize?.({
      projectPath: process.cwd(),
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Run the security audit
    const result = await mcpWizard.auditSecurity({
      autoFix: process.argv.includes('--auto-fix')
    });
    
    if (!result.success) {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
    
    // Display results
    if (result.secure) {
      console.log('✅ MCP configuration passed security audit.');
    } else {
      console.log(`⚠️ Security issues detected: ${result.issues.length} issues found`);
      
      // Group issues by severity
      const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
      const warningIssues = result.issues.filter(issue => issue.severity === 'warning');
      const infoIssues = result.issues.filter(issue => issue.severity === 'info');
      
      // Display critical issues
      if (criticalIssues.length > 0) {
        console.log(`\n🔴 Critical Issues: ${criticalIssues.length}`);
        criticalIssues.forEach(issue => {
          console.log(`- ${issue.message}`);
          if (issue.recommendation) {
            console.log(`  Recommendation: ${issue.recommendation}`);
          }
        });
      }
      
      // Display warning issues
      if (warningIssues.length > 0) {
        console.log(`\n🟠 Warnings: ${warningIssues.length}`);
        warningIssues.forEach(issue => {
          console.log(`- ${issue.message}`);
          if (issue.recommendation) {
            console.log(`  Recommendation: ${issue.recommendation}`);
          }
        });
      }
      
      // Display info issues
      if (infoIssues.length > 0) {
        console.log(`\n🔵 Information: ${infoIssues.length}`);
        infoIssues.forEach(issue => {
          console.log(`- ${issue.message}`);
          if (issue.recommendation) {
            console.log(`  Recommendation: ${issue.recommendation}`);
          }
        });
      }
      
      // Display recommendations
      if (result.recommendations && result.recommendations.length > 0) {
        console.log(`\n📋 Recommendations:`);
        result.recommendations.forEach(recommendation => {
          console.log(`\n${recommendation.title}`);
          recommendation.steps.forEach(step => {
            console.log(`- ${step}`);
          });
        });
      }
      
      // Display auto-fix results if applied
      if (result.fixes) {
        console.log(`\n🔧 Applied Fixes: ${result.fixes.appliedFixes.length}`);
        result.fixes.appliedFixes.forEach(fix => {
          console.log(`- ${fix.message}`);
        });
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runAudit();