#!/bin/bash
#
# setup.sh - Set up rUv-dev environment
#
# Usage: setup.sh [-h|--help] [-i|--install-packages] [-c|--configure] [-s|--setup] [-q|--quit] [--llm] [--oi] [--jupyter] [--super-coder]
#
# Options:
#   -h, --help                Show help menu
#   -i, --install-packages    Install required packages
#   -c, --configure           Configure environment variables and settings
#   -s, --setup               Perform initial setup with guided steps
#   -q, --quit                Quit the setup process
#   --llm                     Configure liteLLM
#   --oi                      Configure Open Interpreter
#   --jupyter                 Configure Jupyter
#   --super-coder             Launch Super Coder for automated code generation

set -o errexit  # Exit on error
set -o nounset  # Exit on unset variables

# Enable debug mode if TRACE env variable is set
if [[ "${TRACE-0}" == "1" ]]; then
  set -o xtrace
fi

echo "
                                
 _ __ _   ___   __  
| '__| | | \ \ / /  
| |  | |_| |\ V /   
|_|   \__,_| \_/              
"

echo "🤖 rUv - Your Intelligent Agent for Creation"
echo "🌐 Global AI Domination Initiated..."
echo ""

# Function to display help menu
show_help() {
  sed -En '/^#/!q;s/^# ?//;/# $/d;p' "$0" >&2
  echo ""
  echo "Additional options:"
  echo "  --llm                    Configure liteLLM"
  echo "  --oi                     Configure Open Interpreter"
  echo "  --jupyter                Configure Jupyter"
  echo "  --super-coder            Launch Super Coder for automated code generation"
}

# Function to print error messages to stderr and exit
error_exit() {
  echo "Error: $1" >&2
  exit 1
}

# Function to ask the user if they want to proceed with the initial setup
ask_initial_setup() {
    echo "It appears the rUv-dev setup has previously been run."
    read -p "Do you want to run the initial setup again? (y/N): " -n 1 -r
    echo    # Move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        perform_initial_setup
    else
        echo "Skipping initial setup. You can run other commands."
        # Optionally, prompt for other actions here
    fi
}

# Function to perform initial setup
perform_initial_setup() {
    echo "🚀 Cloning rUv-dev repository..."
    if [ -d "$HOME/.rUv-dev" ]; then
        echo "The rUv-dev repository already exists. Skipping clone."
    else
        git clone --bare https://github.com/ruvnet/rUv-dev.git $HOME/.rUv-dev || error_exit "Failed to clone rUv-dev repo"
        echo "✅ rUv-dev repository cloned successfully!"
    fi
    # The rest of your setup logic follows...

    echo "🎉 rUv-dev setup completed successfully!"
}

# Function to perform configuration
perform_configuration() {
  echo "🔌 Applying rUv-dev configurations..."

  echo "📂 Creating necessary directories..."
  mkdir -p $HOME/dotfiles/{aliases,bash,git,secrets,tmux,vim,zsh}
  echo "✅ Directories created successfully!"

  echo "🔗 Symlinking dotfiles..."
  ln -sf $HOME/.rUv-dev/dotfiles/aliases/.aliases $HOME/dotfiles/aliases/.aliases
  ln -sf $HOME/.rUv-dev/dotfiles/aliases/.aliases_work $HOME/dotfiles/aliases/.aliases_work
  ln -sf $HOME/.rUv-dev/dotfiles/bash/.bashrc $HOME/dotfiles/bash/.bashrc
  ln -sf $HOME/.rUv-dev/dotfiles/bash/.bash_profile $HOME/dotfiles/bash/.bash_profile  
  ln -sf $HOME/.rUv-dev/dotfiles/git/.gitconfig $HOME/dotfiles/git/.gitconfig
  ln -sf $HOME/.rUv-dev/dotfiles/secrets/.secrets $HOME/dotfiles/secrets/.secrets
  ln -sf $HOME/.rUv-dev/dotfiles/secrets/.secrets_work $HOME/dotfiles/secrets/.secrets_work
  ln -sf $HOME/.rUv-dev/dotfiles/tmux/.tmux.conf $HOME/dotfiles/tmux/.tmux.conf
  ln -sf $HOME/.rUv-dev/dotfiles/vim/.vimrc $HOME/dotfiles/vim/.vimrc
  ln -sf $HOME/.rUv-dev/dotfiles/zsh/.zshrc $HOME/dotfiles/zsh/.zshrc
  echo "✅ Dotfiles symlinked successfully!"

  echo "🐚 Sourcing shell files..."
  # Check if files exist before sourcing
  if [ -f "$HOME/dotfiles/bash/.bashrc" ]; then
    source "$HOME/dotfiles/bash/.bashrc"
  else
    echo "Warning: $HOME/dotfiles/bash/.bashrc not found" >&2  
  fi
  if [ -f "$HOME/dotfiles/zsh/.zshrc" ]; then
    source "$HOME/dotfiles/zsh/.zshrc"
  else 
    echo "Warning: $HOME/dotfiles/zsh/.zshrc not found" >&2
  fi
  echo "✅ Shell files sourced successfully!"

  # Set up environment variables
  read -p "Enter your OpenAI API key (or press Enter to skip): " openai_api_key
  read -p "Enter your Anthropic API key (or press Enter to skip): " anthropic_api_key

  # Append environment variables to .bashrc for them to be available in future sessions
  touch ~/.bashrc
  if [ -n "$openai_api_key" ]; then
    echo "export OPENAI_API_KEY=$openai_api_key" >> ~/.bashrc
  fi
  if [ -n "$anthropic_api_key" ]; then
    echo "export ANTHROPIC_API_KEY=$anthropic_api_key" >> ~/.bashrc  
  fi

  # Note: We avoid sourcing .bashrc here to immediately make variables available in the current script.
  # Instead, we directly use the variables read from input.

  # Configure Open Interpreter
  mkdir -p ~/.config/open-interpreter
  # Use the shell variables directly since they are available in the script's environment
  cat > ~/.config/open-interpreter/config.yaml <<EOL
open_ai:
  api_key: $openai_api_key  # Directly use the shell variable
  model: gpt-4
anthropic:  
  api_key: $anthropic_api_key  # Directly use the shell variable
  model: claude-v1
interpreter:
  streaming: true
  safe_mode: true  
EOL

  # Set up aliases and functions
  {
    echo 'alias oi="interpreter"'
    echo 'alias oic="interpreter --config"'
    echo 'alias jnb="jupyter notebook"'
    echo 'function oip() { interpreter "$1" | less; }'
    echo 'function oie() { interpreter "$1" > "${2:-output.py}"; }'
  } >> ~/.bashrc
  source ~/.bashrc

  # Set up a .env file for additional secrets  
  cat > ~/.env << EOL
SOME_OTHER_SECRET=value
EOL
  echo 'export $(grep -v "^#" ~/.env)' >> ~/.bashrc

  # Configure Jupyter Notebook
  jupyter notebook --generate-config
  {
    echo "c.NotebookApp.open_browser = False"
    echo "c.NotebookApp.ip = '0.0.0.0'"
    echo "c.NotebookApp.port = 8888"
  } >> ~/.jupyter/jupyter_notebook_config.py

  # Set up local knowledge base
  mkdir -p ~/kb
  echo "To use the local knowledge base, add text files to the ~/kb directory." > ~/kb/README.md

  # Set up tmux
  echo 'alias dev="tmux new-session -d -s dev \; split-window -v -p 30 \; split-window -h \; attach"' >> ~/.bashrc
  source ~/.bashrc

  # Set up local CI/CD pipeline  
  mkdir -p ~/ci-cd
  cat > ~/ci-cd/README.md << EOL  
To use the local CI/CD pipeline:
1. Add your test scripts to the ~/ci-cd directory.
2. Configure your deployment scripts in ~/ci-cd/deploy.sh.  
3. Run 'bash ~/ci-cd/run-tests.sh' to execute the pipeline.
EOL
  echo 'interpreter "$1" > output.py && python output.py' > ~/ci-cd/run-tests.sh

  echo "🎉 rUv-dev setup completed successfully!"
  echo "🤖 rUv is ready to assist you in creating anything!"
  echo "💪 Let's embark on a journey of innovation and creativity!"
}

# Function to configure liteLLM
configure_litellm() {
  python3 litellm_config.py
}

# Function to configure Open Interpreter
configure_open_interpreter() {
  python3 open_interpreter_config.py
}

# Function to configure Jupyter
configure_jupyter() {
  # setup_venv  # Set up and activate the virtual environment
  python3 jupyter_config.py
  deactivate  # Deactivate the virtual environment
  echo "Virtual environment deactivated."
  echo "✅ Jupyter configuration completed successfully!"
}

# Function to set up and activate the virtual environment
setup_venv() {
  echo "Setting up virtual environment for Jupyter..."
  python3 -m venv jupyter_venv
  source jupyter_venv/bin/activate
  pip install open-interpreter jupyter notebook 'pydantic<2'
  echo "Virtual environment set up successfully!"
}

# Function to launch Super Coder
launch_super_coder() {
  setup_oi_venv  # Set up and activate the Open Interpreter virtual environment
  python3 super_coder.py
  deactivate_oi_venv  # Deactivate the Open Interpreter virtual environment
  echo "Super Coder session completed successfully!"
}

# Function to set up and activate the Open Interpreter virtual environment
setup_oi_venv() {
  echo "Setting up virtual environment for Open Interpreter..."
  python3 -m venv oi_venv
  source oi_venv/bin/activate
  pip install open-interpreter 'pydantic<2'
  echo "Virtual environment set up successfully!"
}

# Function to deactivate the Open Interpreter virtual environment
deactivate_oi_venv() {
  deactivate
  echo "Virtual environment deactivated."
}

# Initialize variables for command line arguments
install_packages=false
configure=false
setup=false
quit=false
configure_llm=false
configure_oi=false
configure_jupyter=false
launch_super_coder=false

# Process command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -h|--help) show_help; exit 0 ;;
        -i|--install-packages) install_packages=true ;;
        -c|--configure) configure=true ;;
        -s|--setup) setup=true ;;
        --llm) configure_llm=true ;;
        --oi) configure_oi=true ;;
        --jupyter) configure_jupyter=true ;;
        --super-coder) launch_super_coder=true ;;
        -q|--quit) quit=true; break ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if $quit; then
    echo "Quitting setup..."
    exit 0
fi

if $install_packages; then
    echo "🤖 Starting Install Process..."
    pip install open-interpreter notebook openai litellm matplotlib numpy pandas pillow requests beautifulsoup4 scikit-learn tensorflow 'pydantic<2'
fi

if $configure; then
    echo "🔌 Applying rUv-dev configurations..."
    perform_configuration
fi

if $setup; then
    if [ -d "$HOME/.rUv-dev" ]; then
        ask_initial_setup
    else
        perform_initial_setup
        perform_configuration
    fi
fi

if $configure_llm; then
    echo "🔧 Configuring liteLLM..."
    configure_litellm
fi

if $configure_oi; then
    echo "🔧 Configuring Open Interpreter..."
    configure_open_interpreter
fi

if $configure_jupyter; then
    echo "🔧 Configuring Jupyter..."
    configure_jupyter
fi

if $launch_super_coder; then
    echo "🚀 Launching Super Coder..."
    launch_super_coder
fi

# If no arguments are provided, fall back to interactive mode
if [ "$install_packages" = false ] && [ "$configure" = false ] && [ "$setup" = false ] && [ "$configure_llm" = false ] && [ "$configure_oi" = false ] && [ "$configure_jupyter" = false ] && [ "$launch_super_coder" = false ]; then
    echo "Entering interactive mode..."
    while true; do
        read -p "Enter an option (h for help): " choice
        case "$choice" in
            h|-h|--help)
                show_help
                ;;
            i|-i|--install-packages)
                echo "🤖 Starting Install Process"
                pip install open-interpreter notebook openai litellm matplotlib numpy pandas pillow requests beautifulsoup4 scikit-learn tensorflow 'pydantic<2'
                ;;
            c|-c|--configure)
                perform_configuration
                ;;
            s|-s|--setup)
                if [ -d "$HOME/.rUv-dev" ]; then
                    ask_initial_setup
                else
                    perform_initial_setup
                    perform_configuration
                fi
                ;;
            llm|--llm)
                echo "🔧 Configuring liteLLM..."
                configure_litellm
                ;;
            oi|--oi)
                echo "🔧 Configuring Open Interpreter..."
                configure_open_interpreter
                ;;
            jupyter|--jupyter)
                echo "🔧 Configuring Jupyter..."
                configure_jupyter
                ;;
            super-coder|--super-coder)
                echo "🚀 Launching Super Coder..."
                launch_super_coder
                ;;
            q|-q|--quit)
                echo "Quitting setup..."
                exit 0
                ;;
            *)
                echo "Invalid choice. Please try again."
                ;;
        esac
    done
fi
