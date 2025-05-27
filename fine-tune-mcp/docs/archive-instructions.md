# Archive Creation Instructions

This document provides instructions for creating a clean archive of the fine-tune-mcp project.

## Creating a ZIP Archive (Excluding Python Cache Files)

To create a ZIP archive of the fine-tune-mcp directory while excluding Python cache files and other unnecessary files, use the following command:

```bash
# Navigate to the parent directory of fine-tune-mcp
cd /workspaces/rUv-dev

# Create a zip archive excluding __pycache__ directories, .env files, and other build artifacts
zip -r fine-tune-mcp.zip fine-tune-mcp -x "*/\__pycache__/*" "*.pyc" "*.pyo" "*/\.pytest_cache/*" "*/.venv/*" "fine-tune-mcp/.env" "fine-tune-mcp/.coverage" "fine-tune-mcp/htmlcov/*" "fine-tune-mcp/fine_tune_mcp.egg-info/*"
```

## Excluded Files and Directories

The following files and directories are excluded from the archive:

1. **Python cache files**:
   - `__pycache__/` directories
   - `.pyc` and `.pyo` compiled Python files

2. **Test and coverage artifacts**:
   - `.pytest_cache/` directory
   - `.coverage` file
   - `htmlcov/` directory with HTML coverage reports

3. **Build artifacts**:
   - `fine_tune_mcp.egg-info/` directory

4. **Environment-specific files**:
   - `.env` file with API keys and secrets
   - `.venv/` virtual environment directory

## Verifying the Archive

After creating the archive, you can verify its contents with:

```bash
unzip -l fine-tune-mcp.zip | grep -v "__pycache__" | less
```

This will list all files in the archive, filtering out any __pycache__ entries that might have been included accidentally.

## Alternative Methods

### Using find (more precise control)

For more precise control over which files to include, you can use the `find` command:

```bash
cd /workspaces/rUv-dev
find fine-tune-mcp -type f -not -path "*/\.*" -not -path "*/\__pycache__/*" -not -path "*/\.pytest_cache/*" -not -path "*/.venv/*" -not -path "*/htmlcov/*" -not -path "*/fine_tune_mcp.egg-info/*" | zip fine-tune-mcp.zip -@
```

### Using Git Archive (if using Git)

If the project is under Git version control, you can create a clean archive using:

```bash
git archive --format=zip --output=fine-tune-mcp.zip HEAD:fine-tune-mcp
```

This will automatically exclude any files listed in `.gitignore`, which typically includes __pycache__ directories and other build artifacts.