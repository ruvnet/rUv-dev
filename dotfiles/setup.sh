#!/bin/bash

echo "
                                
 _ __ _   ___   __  
| '__| | | \ \ / /  
| |  | |_| |\ V /   
|_|   \__,_| \_/    
                    
Welcome to the rUv AI Development System Installer!

This installer will guide you through setting up the rUv AI Development System.
It will install the necessary packages, configure the environment, and set up the tools.

Please follow the prompts to complete the installation.

"

# Install required packages
echo "Installing required packages..."
pip install open-interpreter notebook openai litellm matplotlib numpy pandas pillow requests beautifulsoup4 scikit-learn tensorflow

# Prompt user for API keys
read -p "Enter your OpenAI API key: " openai_api_key
read -p "Enter your Anthropic API key: " anthropic_api_key

# Set up environment variables
echo "Setting up environment variables..."
echo "export OPENAI_API_KEY=$openai_api_key" >> ~/.zshrc
echo "export ANTHROPIC_API_KEY=$anthropic_api_key" >> ~/.zshrc

# Configure Open Interpreter
echo "Configuring Open Interpreter..."
mkdir -p ~/.config/open-interpreter
cat > ~/.config/open-interpreter/config.yaml << EOL
open_ai:
  api_key: ${openai_api_key}
  model: gpt-4
anthropic:
  api_key: ${anthropic_api_key}
  model: claude-v1
interpreter:
  streaming: true
  safe_mode: true
EOL

# Set up aliases and functions
echo "Setting up aliases and functions..."
echo 'alias oi="interpreter"' >> ~/.zshrc
echo 'alias oic="interpreter --config"' >> ~/.zshrc
echo 'alias jnb="jupyter notebook"' >> ~/.zshrc
echo 'function oip() { interpreter "$1" | less; }' >> ~/.zshrc
echo 'function oie() { interpreter "$1" > "${2:-output.py}"; }' >> ~/.zshrc

# Configure Jupyter Notebook
echo "Configuring Jupyter Notebook..."
jupyter notebook --generate-config
echo "c.NotebookApp.open_browser = False" >> ~/.jupyter/jupyter_notebook_config.py
echo "c.NotebookApp.ip = '0.0.0.0'" >> ~/.jupyter/jupyter_notebook_config.py
echo "c.NotebookApp.port = 8888" >> ~/.jupyter/jupyter_notebook_config.py

# Set up local knowledge base
echo "Setting up local knowledge base..."
mkdir -p ~/kb
echo "To use the local knowledge base, add text files to the ~/kb directory." > ~/kb/README.md

# Set up tmux
echo "Setting up tmux..."
echo 'alias dev="tmux new-session -d -s dev \; split-window -v -p 30 \; split-window -h \; attach"' >> ~/.zshrc

# Set up local CI/CD pipeline
echo "Setting up local CI/CD pipeline..."
mkdir -p ~/ci-cd
echo "To use the local CI/CD pipeline:
1. Add your test scripts to the ~/ci-cd directory.
2. Configure your deployment scripts in ~/ci-cd/deploy.sh.
3. Run 'bash ~/ci-cd/run-tests.sh' to execute the pipeline." > ~/ci-cd/README.md
echo 'interpreter "$1" > output.py && python output.py' > ~/ci-cd/run-tests.sh

# Test OpenAI API configuration
echo "Testing OpenAI API configuration..."
python -c "from litellm.openai import OpenAI; llm = OpenAI(api_key='$openai_api_key', model='gpt-3.5-turbo'); response = llm.chat('Hello, how are you?'); print(response)"

if [ $? -eq 0 ]; then
    echo "✅ rUv development environment setup successfully!"
else
    echo "❌ OpenAI API configuration test failed. Please check your API key and network connection."
fi

echo "
Installation complete!

To start using the rUv AI Development System:
1. Restart your terminal or run 'source ~/.zshrc'.
2. Use the 'oi' command to launch Open Interpreter.
3. Use the 'jnb' command to launch Jupyter Notebook.
4. Use the 'dev' command to start a preconfigured tmux session.

Happy coding with rUv!
"
