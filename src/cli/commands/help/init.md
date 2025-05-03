# create-sparc init

Create a new SPARC project or initialize SPARC files in an existing project.

## Usage

### When using npx:

```bash
# Create a new project with a specific name
npx create-sparc init my-project

# Initialize SPARC files in the current directory
npx create-sparc init
```

### When running with Node directly:

```bash
# Create a new project with a specific name
node bin/index.js init my-project

# Initialize SPARC files in the current directory
node bin/index.js init
```

**IMPORTANT**: When running with Node directly, do NOT include 'create-sparc' in the command:
- ❌ Incorrect: `node bin/index.js create-sparc init`
- ✅ Correct: `node bin/index.js init`

## Options

- `-t, --template <name>` - Template to use (default: "default")
- `-f, --force` - Allow initialization in non-empty directories
- `--skip-install` - Skip dependency installation
- `--use-npm` - Use npm as package manager
- `--use-yarn` - Use yarn as package manager
- `--use-pnpm` - Use pnpm as package manager
- `--no-git` - Skip git initialization
- `--typescript` - Use TypeScript
- `--no-symlink` - Disable symlink creation

## Examples

```bash
# Create a TypeScript project
npx create-sparc init my-ts-project --typescript

# Initialize SPARC files in current directory without git
npx create-sparc init --no-git

# Create a project with a specific template
npx create-sparc init my-project --template custom-template