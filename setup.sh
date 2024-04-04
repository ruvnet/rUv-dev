#!/bin/bash

echo "
                                
 _ __ _   ___   __  
| '__| | | \ \ / /  
| |  | |_| |\ V /   
|_|   \__,_| \_/              
"

echo "🤖 rUv - Your Intelligent Agent for Creation"
echo "🌐 Global Ai Domination Initiated..."
echo ""

show_help() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  h, --help                Show this help menu"
    echo "  i, --install-packages    Install required packages"
    echo "  c, --configure           Configure environment variables and settings"
    echo "  s, --setup               Perform initial setup with guided steps"
    echo "  q, --quit                Quit the setup process"
}

perform_initial_setup() {
    echo "🚀 Cloning rUv-dev repository..."
    if [ -d "$HOME/.rUv-dev" ]; then
        echo "The rUv-dev repository already exists. Skipping clone."
    else
        git clone --bare https://github.com/ruvnet/rUv-dev.git $HOME/.rUv-dev
        echo "✅ rUv-dev repository cloned successfully!"
    fi

    echo "🔧 Defining rUv-dev alias..."
    alias ruvdev='git --git-dir=$HOME/.rUv-dev/ --work-tree=$HOME'
    echo "✅ rUv-dev alias defined!"

    echo "🔄 Checking out rUv-dev files to home directory..."
    mkdir -p $HOME/.rUv-dev-backup
    ruvdev checkout 2>&1 | egrep "\s+\." | awk {'print $1'} | xargs -I{} mv {} $HOME/.rUv-dev-backup/{}
    ruvdev checkout
    echo "✅ rUv-dev files checked out successfully!"

    echo "👀 Setting flag to hide untracked files..."
    ruvdev config --local status.showUntrackedFiles no
    echo "✅ Flag set to hide untracked files!"

    # Rest of the setup process...
}

perform_configuration() {
    echo "🔌 Applying rUv-dev configurations..."

    echo "📂 Creating necessary directories..."
    mkdir -p $HOME/dotfiles/aliases
    mkdir -p $HOME/dotfiles/bash
    mkdir -p $HOME/dotfiles/git
    mkdir -p $HOME/dotfiles/secrets
    mkdir -p $HOME/dotfiles/tmux
    mkdir -p $HOME/dotfiles/vim
    mkdir -p $HOME/dotfiles/zsh
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
    if [ -f $HOME/dotfiles/bash/.bashrc ]; then
      . $HOME/dotfiles/bash/.bashrc
    fi
    if [ -f $HOME/dotfiles/zsh/.zshrc ]; then
      . $HOME/dotfiles/zsh/.zshrc
    fi
    echo "✅ Shell files sourced successfully!"

    # Set up environment variables
    read -p "Enter your OpenAI API key (or press Enter to skip): " openai_api_key
    read -p "Enter your Anthropic API key (or press Enter to skip): " anthropic_api_key

    if [ -n "$openai_api_key" ]; then
        echo "export OPENAI_API_KEY=$openai_api_key" >> ~/.bashrc
    fi

    if [ -n "$anthropic_api_key" ]; then
        echo "export ANTHROPIC_API_KEY=$anthropic_api_key" >> ~/.bashrc
    fi

    source ~/.bashrc

    # Configure Open Interpreter
    mkdir -p ~/.config/open-interpreter
    cat > ~/.config/open-interpreter/config.yaml << EOL
open_ai:
  api_key: ${OPENAI_API_KEY}
  model: gpt-4
anthropic:
  api_key: ${ANTHROPIC_API_KEY}
  model: claude-v1
interpreter:
  streaming: true
  safe_mode: true
EOL

    # Set up aliases and functions
    echo 'alias oi="interpreter"' >> ~/.bashrc
    echo 'alias oic="interpreter --config"' >> ~/.bashrc
    echo 'alias jnb="jupyter notebook"' >> ~/.bashrc
    echo 'function oip() { interpreter "$1" | less; }' >> ~/.bashrc
    echo 'function oie() { interpreter "$1" > "${2:-output.py}"; }' >> ~/.bashrc
    source ~/.bashrc

    # Set up a .env file for additional secrets
    cat > ~/.env << EOL
SOME_OTHER_SECRET=value
EOL
    echo 'export $(grep -v "^#" ~/.env)' >> ~/.bashrc

    # Configure Jupyter Notebook
    jupyter notebook --generate-config
    echo "c.NotebookApp.open_browser = False" >> ~/.jupyter/jupyter_notebook_config.py
    echo "c.NotebookApp.ip = '0.0.0.0'" >> ~/.jupyter/jupyter_notebook_config.py
    echo "c.NotebookApp.port = 8888" >> ~/.jupyter/jupyter_notebook_config.py

    # Set up local knowledge base
    mkdir -p ~/kb
    echo "To use the local knowledge base, add text files to the ~/kb directory." > ~/kb/README.md

    # Set up tmux
    echo 'alias dev="tmux new-session -d -s dev \; split-window -v -p 30 \; split-window -h \; attach"' >> ~/.bashrc
    source ~/.bashrc

    # Set up local CI/CD pipeline
    mkdir -p ~/ci-cd
    echo "To use the local CI/CD pipeline:
1. Add your test scripts to the ~/ci-cd directory.
2. Configure your deployment scripts in ~/ci-cd/deploy.sh.
3. Run 'bash ~/ci-cd/run-tests.sh' to execute the pipeline." > ~/ci-cd/README.md
    echo 'interpreter "$1" > output.py && python output.py' > ~/ci-cd/run-tests.sh

    echo "🎉 rUv-dev setup completed successfully!"
    echo "🤖 rUv is ready to assist you in creating anything!"
    echo "💪 Let's embark on a journey of innovation and creativity!"
}

show_help
echo ""

while true; do
    echo "Enter an option (h for help): "
    read -p "> " choice

    case "$choice" in
        h|-h|--help) show_help;;
        i|-i|--install-packages)
            echo "🤖 Starting Install Process"

            # Install Open Interpreter
            pip install open-interpreter

            # Install Jupyter Notebook
            pip install notebook

            # Install OpenAI and LiteLLM libraries
            pip install openai litellm

            # Install useful packages for Open Interpreter and Jupyter Notebook
            pip install matplotlib numpy pandas pillow requests beautifulsoup4 scikit-learn tensorflow
            ;;
        c|-c|--configure) perform_configuration;;
        s|-s|--setup) perform_initial_setup; perform_configuration;;
        q|-q|--quit) echo "Quitting setup..."; exit 0;;
        *) echo "Invalid choice. Please try again.";;
    esac
done
