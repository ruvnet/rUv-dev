# Create-SPARC NPX Package: Pseudocode Phase

## Overview

The Pseudocode phase outlines the high-level logic, core functions, and data structures for the create-sparc NPX package. This document establishes the logical framework that will guide the detailed architecture and implementation.

## Main Program Flow

```
FUNCTION main():
    Parse command line arguments and options
    Identify command (init, add, help, etc.)
    Validate global options
    
    IF command is "help" or "--help" flag is set:
        Display help information based on context
        EXIT with success
    
    IF command is "version" or "--version" flag is set:
        Display version information
        EXIT with success
    
    IF command is "init":
        Execute initProject() with parsed options
    ELSE IF command is "add":
        Execute addComponent() with parsed options
    ELSE:
        Display error for unknown command
        EXIT with error
        
    EXIT with success
```

## Project Initialization Flow

```
FUNCTION initProject(projectName, options):
    // Validation
    IF NOT isValidProjectName(projectName):
        Display validation error
        EXIT with error
    
    // Configuration preparation
    config = createConfigurationObject(projectName, options)
    
    // Interactive mode
    IF options.interactive:
        config = promptForConfiguration(config)
    
    // Validate configuration
    validationResult = validateConfiguration(config)
    IF NOT validationResult.valid:
        Display validation errors
        EXIT with error
    
    // Project creation
    TRY:
        // Start project creation
        Display "Creating project..."
        
        // Create project directory
        createProjectDirectory(config.projectPath)
        
        // Process templates
        templateResult = processTemplates(config)
        
        // Create project structure
        createProjectStructure(templateResult, config)
        
        // Setup symlinks
        IF config.symlink.enabled:
            TRY:
                setupSymlinks(config)
            CATCH symlinkError:
                logWarning("Symlink creation failed, falling back to copy")
                fallbackToCopy(config, symlinkError)
        
        // Generate configuration files
        generateConfigFiles(config)
        
        // Install dependencies
        IF config.installDependencies:
            installDependencies(config)
        
        // Git initialization
        IF config.git.init:
            initializeGit(config)
        
        // Display success message
        DisplaySuccess("Project created successfully at " + config.projectPath)
        DisplayNextSteps(config)
        
    CATCH error:
        HandleError(error)
        EXIT with error
        
    EXIT with success
```

## Component Addition Flow

```
FUNCTION addComponent(componentName, options):
    // Validation
    IF NOT isValidComponentName(componentName):
        Display validation error
        EXIT with error
    
    // Locate existing project
    projectConfig = findProjectConfiguration()
    IF NOT projectConfig:
        Display error "Not a SPARC project directory"
        EXIT with error
    
    // Component configuration
    componentConfig = createComponentConfig(componentName, options, projectConfig)
    
    // Process component template
    templateResult = processComponentTemplate(componentConfig)
    
    // Add component to project
    TRY:
        addComponentFiles(templateResult, componentConfig)
        updateProjectConfiguration(componentConfig)
        
        IF componentConfig.installDependencies:
            installComponentDependencies(componentConfig)
        
        DisplaySuccess("Component added successfully")
        
    CATCH error:
        HandleError(error)
        EXIT with error
        
    EXIT with success
```

## Key Functions

### Configuration Management

```
FUNCTION createConfigurationObject(projectName, options):
    // Create base configuration object with defaults
    config = {
        projectName: projectName,
        projectPath: resolvePath(projectName),
        template: options.template || "default",
        installDependencies: !options.skipInstall,
        symlink: {
            enabled: options.symlink !== false,
            paths: [".roo", ".roomodes"]
        },
        features: {
            typescript: options.typescript || false,
            testing: options.testing || true,
            cicd: options.cicd || false
        },
        npmClient: determineNpmClient(options),
        git: {
            init: options.git !== false,
            initialCommit: options.git !== false
        },
        verbose: options.verbose || false
    }
    
    RETURN config
```

### Template Processing

```
FUNCTION processTemplates(config):
    // Load template
    template = loadTemplate(config.template)
    IF NOT template:
        THROW new Error("Template not found: " + config.template)
    
    // Create template context
    context = createTemplateContext(config)
    
    // Process all template files
    result = {
        files: [],
        directories: []
    }
    
    FOR EACH file IN template.files:
        IF isConditionalFile(file) AND NOT evaluateCondition(file.condition, context):
            CONTINUE
        
        processedContent = processFileContent(file.content, context)
        targetPath = processPath(file.path, context)
        
        result.files.push({
            path: targetPath,
            content: processedContent,
            executable: file.executable || false
        })
    
    FOR EACH dir IN template.directories:
        IF isConditionalDirectory(dir) AND NOT evaluateCondition(dir.condition, context):
            CONTINUE
            
        targetPath = processPath(dir.path, context)
        result.directories.push({
            path: targetPath
        })
    
    RETURN result
```

### Symlink Management

```
FUNCTION setupSymlinks(config):
    // Check symlink support
    IF NOT isSymlinkSupported():
        THROW new Error("Symlinks not supported on this platform")
    
    // Create symlinks for defined paths
    FOR EACH path IN config.symlink.paths:
        sourcePath = resolveTemplatePath(path, config.template)
        targetPath = resolvePath(config.projectPath, path)
        
        createParentDirectories(targetPath)
        createSymlink(sourcePath, targetPath)
        
        // Track symlink for reporting
        trackSymlink(sourcePath, targetPath)
```

### Fallback Copy Mechanism

```
FUNCTION fallbackToCopy(config, symlinkError):
    // Log detailed error
    logError("Symlink creation failed", symlinkError)
    
    // Proceed with copy instead
    FOR EACH path IN config.symlink.paths:
        sourcePath = resolveTemplatePath(path, config.template)
        targetPath = resolvePath(config.projectPath, path)
        
        copyDirectory(sourcePath, targetPath)
        
        // Add metadata file to track original intent
        createSymlinkMetadata(targetPath, sourcePath)
```

### Dependency Installation

```
FUNCTION installDependencies(config):
    // Determine package manager command
    command = getPackageManagerCommand(config.npmClient)
    
    // Install dependencies
    DisplayStatus("Installing dependencies...")
    
    TRY:
        executeCommand(command + ' install', {
            cwd: config.projectPath,
            stdio: config.verbose ? 'inherit' : 'pipe'
        })
        
        DisplayStatus("Dependencies installed successfully")
    CATCH error:
        IF isNetworkError(error):
            // Retry with exponential backoff for network errors
            retryInstallation(config, 3) // Retry 3 times
        ELSE:
            THROW error
```

### Error Handling

```
FUNCTION HandleError(error):
    // Categorize error
    errorType = categorizeError(error)
    
    // Log error details
    logErrorDetails(error)
    
    // Display user-friendly message
    userMessage = generateUserFriendlyMessage(error, errorType)
    DisplayError(userMessage)
    
    // Suggest recovery steps
    recoverySuggestions = generateRecoverySuggestions(error, errorType)
    DisplaySuggestions(recoverySuggestions)
    
    // Attempt recovery for certain errors
    IF canAutoRecover(errorType):
        success = attemptRecovery(error, errorType)
        IF success:
            DisplayStatus("Issue automatically resolved, continuing...")
            RETURN true
    
    RETURN false
```

## Core Data Structures

### Configuration Object

```
ConfigurationObject {
    projectName: string,
    projectPath: string,
    template: string,
    installDependencies: boolean,
    symlink: {
        enabled: boolean,
        paths: string[]
    },
    features: {
        typescript: boolean,
        testing: boolean,
        cicd: boolean,
        [key: string]: boolean
    },
    npmClient: "npm" | "yarn" | "pnpm",
    git: {
        init: boolean,
        initialCommit: boolean
    },
    verbose: boolean
}
```

### Template Context Object

```
TemplateContextObject {
    project: {
        name: string,
        safeName: string, // Safe for variable names
        description: string
    },
    features: {
        typescript: boolean,
        testing: boolean,
        cicd: boolean,
        [key: string]: boolean
    },
    author: {
        name: string,
        email: string
    },
    paths: {
        root: string,
        roo: string,
        roomodes: string
    }
}
```

### Template Definition Object

```
TemplateDefinition {
    name: string,
    description: string,
    files: Array<{
        path: string,
        content: string,
        executable?: boolean,
        condition?: string
    }>,
    directories: Array<{
        path: string,
        condition?: string
    }>,
    dependencies: {
        production: Record<string, string>,
        development: Record<string, string>
    },
    options: {
        // Template-specific options
        [key: string]: any
    }
}
```

### Error Object

```
ErrorObject {
    code: string,
    message: string,
    details?: any,
    recoverable: boolean,
    suggestions?: string[],
    originalError?: Error
}
```

## Key Algorithms

### Project Name Validation

```
FUNCTION isValidProjectName(name):
    // Check if name is provided
    IF name is empty:
        RETURN false
        
    // Check if name follows npm package name rules
    IF NOT matchesNpmNamePattern(name):
        RETURN false
        
    // Check for reserved/blacklisted names
    IF isReservedName(name):
        RETURN false
        
    // Check for existing directory
    IF directoryExists(name) AND NOT isEmpty(name):
        RETURN false
        
    RETURN true
```

### Symlink Support Detection

```
FUNCTION isSymlinkSupported():
    // Check platform
    IF process.platform === "win32":
        // On Windows, check if running with admin privileges
        // or if developer mode is enabled
        RETURN checkWindowsSymlinkPermissions()
    ELSE:
        // On Unix systems, create a test symlink
        testFile = createTempFile()
        testLink = testFile + ".link"
        
        TRY:
            createSymlink(testFile, testLink)
            removeFile(testLink)
            removeFile(testFile)
            RETURN true
        CATCH:
            RETURN false
```

### Template Variable Resolution

```
FUNCTION processFileContent(content, context):
    // Replace template variables
    processedContent = content
    
    // Simple variable replacement
    FOR EACH key, value IN flattenObject(context):
        placeholder = "{{" + key + "}}"
        processedContent = replace(processedContent, placeholder, value)
    
    // Conditional blocks
    processedContent = processConditionalBlocks(processedContent, context)
    
    RETURN processedContent
```

## Test-Driven Development Anchors

1. **Project Name Validation Tests**:
   - Valid project names are accepted
   - Invalid characters are rejected
   - Reserved names are rejected
   - Empty names are rejected

2. **Configuration Validation Tests**:
   - Required fields are validated
   - Type checking is enforced
   - Conflicting options are detected

3. **Template Processing Tests**:
   - Variables are correctly replaced
   - Conditional sections work properly
   - File paths are correctly processed

4. **Symlink Management Tests**:
   - Symlinks are created when supported
   - Fallback copy works when symlinks fail
   - Metadata is correctly stored

5. **Error Handling Tests**:
   - Errors are properly categorized
   - User-friendly messages are generated
   - Recovery mechanisms work as expected

6. **Command Line Interface Tests**:
   - Commands are correctly parsed
   - Options are properly handled
   - Help information is displayed correctly

7. **End-to-End Flow Tests**:
   - Project is successfully created
   - Components are correctly added
   - Dependencies are properly installed