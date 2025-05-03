# create-sparc aigi

Create and manage AIGI projects.

## Usage

### When using npx:

```bash
# Create a new AIGI project with a specific name
npx create-sparc aigi init my-aigi-project

# Initialize AIGI files in the current directory
npx create-sparc aigi init
```

### When running with Node directly:

```bash
# Create a new AIGI project with a specific name
node bin/index.js aigi init my-aigi-project

# Initialize AIGI files in the current directory
node bin/index.js aigi init
```

**IMPORTANT**: When running with Node directly, do NOT include 'create-sparc' in the command:
- ❌ Incorrect: `node bin/index.js create-sparc aigi init`
- ✅ Correct: `node bin/index.js aigi init`

## Commands

### init [name]

Create a new AIGI project or initialize AIGI files in an existing project.

#### Options

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
# Create a TypeScript AIGI project
npx create-sparc aigi init my-ts-aigi-project --typescript

# Initialize AIGI files in current directory without git
npx create-sparc aigi init --no-git

# Create an AIGI project with a specific template
npx create-sparc aigi init my-aigi-project --template custom-template