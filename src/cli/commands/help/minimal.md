# create-sparc minimal

Create a new minimal Roo mode framework or initialize minimal Roo mode files in an existing project.

## Usage

### When using npx:

```bash
# Create a new minimal Roo mode framework with a specific name
npx create-sparc minimal init my-project

# Initialize minimal Roo mode files in the current directory
npx create-sparc minimal init
```

### When running with Node directly:

```bash
# Create a new minimal Roo mode framework with a specific name
node bin/index.js minimal init my-project

# Initialize minimal Roo mode files in the current directory
node bin/index.js minimal init
```

**IMPORTANT**: When running with Node directly, do NOT include 'create-sparc' in the command:
- ❌ Incorrect: `node bin/index.js create-sparc minimal init`
- ✅ Correct: `node bin/index.js minimal init`

## Options

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
# Create a TypeScript minimal Roo mode framework
npx create-sparc minimal init my-ts-project --typescript

# Initialize minimal Roo mode files in current directory without git
npx create-sparc minimal init --no-git

# Create a minimal Roo mode framework with force option
npx create-sparc minimal init my-project --force
```

## What is a Minimal Roo Mode Framework?

The minimal Roo mode framework provides a lightweight foundation for creating custom Roo modes. It includes only the essential files and structure needed to get started with Roo mode development, making it ideal for developers who want to create their own custom modes without the full SPARC project structure.