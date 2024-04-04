# rUv AI Development System - Optimized Zsh Configuration

# Enable Powerlevel10k instant prompt
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# Path to your oh-my-zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Theme
ZSH_THEME="powerlevel10k/powerlevel10k"

# Plugins
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

# Load oh-my-zsh
source $ZSH/oh-my-zsh.sh

# Load aliases
if [ -f ~/.aliases ]; then
    . ~/.aliases
fi

# Load work-specific aliases if the file exists
if [ -f ~/.aliases_work ]; then
    . ~/.aliases_work
fi

# Load secrets
if [ -f ~/.secrets ]; then
    . ~/.secrets
fi

# Load work-specific secrets if the file exists
if [ -f ~/.secrets_work ]; then
    . ~/.secrets_work
fi

# Configure Open Interpreter
export OPENAI_API_KEY="your_api_key_here"
export ANTHROPIC_API_KEY="your_api_key_here"

# Set up the prompt
PROMPT='%F{green}%n@%m %F{blue}%~%f %# '

# Enable auto-completion
autoload -Uz compinit
compinit

# Set up the local knowledge base
export KB_DIR="$HOME/kb"

# Set up the local CI/CD pipeline
export CI_CD_DIR="$HOME/ci-cd"

# Custom functions
function oip() {
  interpreter "$1" | less
}

function oie() {
  interpreter "$1" > "${2:-output.py}"
}

function cit() {
  bash ~/ci-cd/run-tests.sh
}

# Keybindings
bindkey '^[OA' history-substring-search-up
bindkey '^[OB' history-substring-search-down

# Automatically start tmux
if command -v tmux &> /dev/null && [ -n "$PS1" ] && [[ ! "$TERM" =~ screen ]] && [[ ! "$TERM" =~ tmux ]] && [ -z "$TMUX" ]; then
  exec tmux new-session -A -s main
fi

# Load Powerlevel10k configuration
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
