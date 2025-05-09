.PHONY: setup run dev install deploy test clean format type-check

# Set the Python version from cookiecutter or default to 3.10
PYTHON_VERSION := 3.10

# Setup with uv
setup:
	# Check if uv is installed, install if not
	@which uv >/dev/null || pip install uv
	# Create a virtual environment
	uv venv
	# Install dependencies with development extras
	uv pip install -e ".[dev]"
	@echo "✅ Environment setup complete. Activate it with 'source .venv/bin/activate' (Unix/macOS) or '.venv\\Scripts\activate' (Windows)"

# Run the server directly
run:
	python -m fine_tune_mcp.server

# Run in development mode with MCP inspector
dev:
	mcp dev fine_tune_mcp.server

# Install in Claude Desktop
install:
	mcp install fine_tune_mcp.server

# Run tests
test:
	pytest

# Run tests with verbose output
test-verbose:
	pytest -v

# Run tests with coverage report
test-coverage:
	pytest --cov=fine_tune_mcp --cov-report=term --cov-report=html
	
# Install test dependencies
setup-test:
	python -m pip install pytest pytest-asyncio>=0.22.0 pytest-anyio pytest-mock pytest-cov
# Format code with black and isort
format:
	black fine_tune_mcp
	isort fine_tune_mcp

# Check types with mypy
type-check:
	mypy fine_tune_mcp

# Clean up build artifacts
clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Docker build
docker-build:
	docker build -t fine-tune-mcp:latest .

# Run with Docker
docker-run:
	docker run -p 8000:8000 fine-tune-mcp:latest