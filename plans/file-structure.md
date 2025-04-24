# Create-SPARC NPX Package: File Structure and Component Descriptions

## File Structure Overview

```
create-sparc/
├── bin/
│   └── create-sparc.js        # Entry point executable
├── src/
│   ├── cli/                   # CLI interface layer
│   │   ├── index.js           # Main CLI entry point
│   │   ├── commands/          # Command implementations
│   │   │   ├── init.js        # Initialize new project
│   │   │   ├── add.js         # Add components to existing project
│   │   │   └── help.js        # Help command
│   │   └── utils/             # CLI utilities
│   │       ├── arguments.js   # Command line argument parsing
│   │       └── display.js     # Terminal output formatting
│   │
│   ├── core/                  # Core business logic
│   │   ├── project-generator/ # Project generation logic
│   │   │   ├── index.js       # Main generator entry point
│   │   │   ├── steps/         # Generation process steps
│   │   │   │   ├── initialize.js     # Project initialization
│   │   │   │   ├── scaffold.js       # File structure creation
│   │   │   │   ├── configure.js      # Configuration setup
│   │   │   │   ├── dependencies.js   # Dependencies installation
│   │   │   │   └── finalize.js       # Final project setup
│   │   │   └── validators/    # Input validation
│   │   │
│   │   ├── template-engine/   # Template processing
│   │   │   ├── index.js       # Template engine
│   │   │   └── processors/    # Template processors
│   │   │
│   │   ├── file-manager/      # File system operations
│   │   │   ├── index.js       # File operations manager
│   │   │   ├── creators.js    # File/directory creation utilities
│   │   │   └── symlink.js     # Symlink creation and management
│   │   │
│   │   └── config-manager/    # Configuration management
│   │       ├── index.js       # Configuration handler
│   │       └── schema.js      # Configuration schema validation
│   │
│   ├── templates/             # Project templates
│   │   ├── base/              # Base project structure
│   │   │   ├── package.json   # Template package.json
│   │   │   ├── README.md      # Template README
│   │   │   └── ...            # Other base files
│   │   │
│   │   ├── roo/               # .roo folder templates
│   │   │   ├── rules/         # Rule templates
│   │   │   ├── modes/         # Mode templates
│   │   │   └── ...            # Other .roo files
│   │   │
│   │   └── roomodes/          # .roomodes template
│   │
│   └── utils/                 # Shared utilities
│       ├── logger.js          # Logging utility
│       ├── error-handler.js   # Error handling 
│       └── constants.js       # Constants and defaults
│
├── test/                      # Test files
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
│
├── package.json               # Package manifest
├── LICENSE                    # License file
└── README.md                  # Project documentation
```

## Component Descriptions

### Entry Point (bin/)

#### bin/create-sparc.js
- **Purpose**: Serves as the executable entry point for the NPX package
- **Responsibilities**:
  - Set up the environment for the CLI
  - Parse initial arguments
  - Handle global error catching
  - Initialize and start the CLI interface

### CLI Interface (src/cli/)

#### cli/index.js
- **Purpose**: Main CLI application that processes user commands
- **Responsibilities**:
  - Register available commands
  - Parse command-line arguments
  - Route to appropriate command handlers
  - Handle global options (verbose, help, version)

#### cli/commands/
- **Purpose**: Implement specific CLI commands
- **Responsibilities**:
  - Define command options and arguments
  - Validate command inputs
  - Execute command logic
  - Provide command-specific help information

#### cli/utils/
- **Purpose**: Support CLI operations
- **Responsibilities**:
  - Parse and validate command-line arguments
  - Format terminal output (colors, spinners, etc.)
  - Handle user interactions (prompts, confirmations)

### Core Logic (src/core/)

#### core/project-generator/
- **Purpose**: Orchestrate the project creation workflow
- **Responsibilities**:
  - Execute generation steps in sequence
  - Handle the project generation lifecycle
  - Coordinate between other components
  - Validate generation configuration

#### core/template-engine/
- **Purpose**: Process templates to generate project files
- **Responsibilities**:
  - Replace variables in templates
  - Handle conditional template sections
  - Support template inheritance and composition
  - Process template includes and extensions

#### core/file-manager/
- **Purpose**: Handle all file system operations
- **Responsibilities**:
  - Create project directory structure
  - Generate files from templates
  - Perform file operations (copy, move, delete)
  - Handle file existence checks and conflicts

#### core/file-manager/symlink.js
- **Purpose**: Specifically handle symbolic link operations
- **Responsibilities**:
  - Create symbolic links for the .roo folder and .roomode files
  - Verify symlink support on target filesystem
  - Provide fallback copy mechanism when symlinks not supported
  - Track symlinked resources for maintenance

#### core/config-manager/
- **Purpose**: Manage project configurations
- **Responsibilities**:
  - Load and validate configuration schemas
  - Generate configuration files for projects
  - Handle user configuration preferences
  - Provide default configurations

### Templates (src/templates/)

#### templates/base/
- **Purpose**: Provide base templates for project generation
- **Responsibilities**:
  - Define standard project structure
  - Provide default configuration files
  - Include common files (README, LICENSE, etc.)

#### templates/roo/
- **Purpose**: Supply templates for the .roo directory
- **Responsibilities**:
  - Define rule templates for different modes
  - Provide mode configuration templates
  - Include other .roo directory resources

#### templates/roomodes/
- **Purpose**: Supply templates for .roomodes file
- **Responsibilities**:
  - Define mode configurations
  - Provide default mode settings

### Utilities (src/utils/)

#### utils/logger.js
- **Purpose**: Provide logging capabilities
- **Responsibilities**:
  - Log information at different levels (debug, info, warn, error)
  - Format log messages for readability
  - Support log redirection (file, console)

#### utils/error-handler.js
- **Purpose**: Centralize error handling
- **Responsibilities**:
  - Categorize and format errors
  - Provide user-friendly error messages
  - Log detailed error information
  - Handle error recovery when possible

#### utils/constants.js
- **Purpose**: Define package-wide constants
- **Responsibilities**:
  - Store version information
  - Define default values
  - Define path constants
  - Store configuration schemas

## Key Design Considerations

1. **Modularity**: Components are designed with clear responsibilities and boundaries, allowing for independent testing and development.

2. **Extensibility**: The architecture supports extension through plugins, custom templates, and commands.

3. **Error Handling**: A centralized error handling system ensures consistent error reporting and recovery.

4. **Configuration**: A dedicated configuration manager handles all aspects of project configuration.

5. **Symlink Support**: Special attention to symlink creation and management for .roo folder and .roomode files, with fallback mechanisms for environments without symlink support.

6. **Testing**: A structured approach to testing with separate unit and integration test directories.