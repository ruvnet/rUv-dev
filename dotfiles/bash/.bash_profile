# Get the aliases and functions
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi

# User specific environment and startup programs
PATH="$HOME/bin:$HOME/.local/bin:$PATH"
export PATH

# Open Interpreter configuration
export OPENAI_API_KEY="your_api_key_here"
export ANTHROPIC_API_KEY="your_api_key_here"

# Local knowledge base
export KB_DIR="$HOME/kb"

# Local CI/CD pipeline
export CI_CD_DIR="$HOME/ci-cd"

# Set up tmux
if command -v tmux &> /dev/null && [ -n "$PS1" ] && [[ ! "$TERM" =~ screen ]] && [[ ! "$TERM" =~ tmux ]] && [ -z "$TMUX" ]; then
  exec tmux new-session -A -s main
fi
