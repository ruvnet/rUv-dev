# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# Path to your dotfiles repository
export DOTFILES_DIR="$HOME/dotfiles"

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
PS1='[\u@\h \W]\$ '

# Enable programmable completion features
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi
