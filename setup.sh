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
  while true; do
    echo ""
    echo "liteLLM Configuration Menu:"
    echo "1. Select LLM Provider"
    echo "2. Set API Keys"
    echo "3. Optimization Settings"
    echo "4. Advanced Settings"
    echo "5. Return to Main Menu"
    echo ""
    read -p "Enter your choice (1-5): " litellm_choice

    case $litellm_choice in
      1)
        echo ""
        echo "Select LLM Provider:"
        echo "1. OpenAI"
        echo "2. Anthropic"
        echo "3. Hugging Face"
        echo "4. Cohere"
        echo "5. Azure OpenAI"
        echo "6. Replicate"
        echo "7. Go Back"
        echo ""
        read -p "Enter your choice (1-7): " llm_provider_choice

        case $llm_provider_choice in
          1)
            echo "export LITELLM_LLM_PROVIDER=openai" >> ~/.bashrc
            echo "✅ OpenAI selected as the LLM provider."
            ;;
          2)
            echo "export LITELLM_LLM_PROVIDER=anthropic" >> ~/.bashrc
            echo "✅ Anthropic selected as the LLM provider."
            ;;
          3)
            echo "export LITELLM_LLM_PROVIDER=huggingface" >> ~/.bashrc
            echo "✅ Hugging Face selected as the LLM provider."
            ;;
          4)
            echo "export LITELLM_LLM_PROVIDER=cohere" >> ~/.bashrc
            echo "✅ Cohere selected as the LLM provider."
            ;;
          5)
            echo "export LITELLM_LLM_PROVIDER=azure" >> ~/.bashrc
            echo "✅ Azure OpenAI selected as the LLM provider."
            ;;
          6)
            echo "export LITELLM_LLM_PROVIDER=replicate" >> ~/.bashrc
            echo "✅ Replicate selected as the LLM provider."
            ;;
          7)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      2)
        echo ""
        read -p "Enter your OpenAI API key (or press Enter to skip): " openai_api_key
        read -p "Enter your Anthropic API key (or press Enter to skip): " anthropic_api_key
        read -p "Enter your Hugging Face API key (or press Enter to skip): " huggingface_api_key
        read -p "Enter your Cohere API key (or press Enter to skip): " cohere_api_key
        read -p "Enter your Azure OpenAI API key (or press Enter to skip): " azure_api_key
        read -p "Enter your Replicate API key (or press Enter to skip): " replicate_api_key

        if [ -n "$openai_api_key" ]; then
          echo "export OPENAI_API_KEY=$openai_api_key" >> ~/.bashrc
          echo "✅ OpenAI API key saved."
        fi
        if [ -n "$anthropic_api_key" ]; then
          echo "export ANTHROPIC_API_KEY=$anthropic_api_key" >> ~/.bashrc
          echo "✅ Anthropic API key saved."
        fi
        if [ -n "$huggingface_api_key" ]; then
          echo "export HUGGINGFACE_API_KEY=$huggingface_api_key" >> ~/.bashrc
          echo "✅ Hugging Face API key saved."
        fi
        if [ -n "$cohere_api_key" ]; then
          echo "export COHERE_API_KEY=$cohere_api_key" >> ~/.bashrc
          echo "✅ Cohere API key saved."
        fi
        if [ -n "$azure_api_key" ]; then
          echo "export AZURE_API_KEY=$azure_api_key" >> ~/.bashrc
          echo "✅ Azure OpenAI API key saved."
        fi
        if [ -n "$replicate_api_key" ]; then
          echo "export REPLICATE_API_KEY=$replicate_api_key" >> ~/.bashrc
          echo "✅ Replicate API key saved."
        fi
        ;;
      3)
        echo ""
        echo "Optimization Settings:"
        echo "1. Enable Streaming"
        echo "2. Set Context Window"
        echo "3. Enable Caching"
        echo "4. Set Rate Limit (RPM)"
        echo "5. Go Back"
        echo ""
        read -p "Enter your choice (1-5): " optimization_choice

        case $optimization_choice in
          1)
            echo "export LITELLM_STREAMING=true" >> ~/.bashrc
            echo "✅ Streaming enabled."
            ;;
          2)
            read -p "Enter the context window size: " context_window
            echo "export LITELLM_CONTEXT_WINDOW=$context_window" >> ~/.bashrc
            echo "✅ Context window size set to $context_window."
            ;;
          3)
            echo "export LITELLM_CACHING=true" >> ~/.bashrc
            echo "✅ Caching enabled."
            ;;
          4)
            read -p "Enter the rate limit (requests per minute): " rate_limit
            echo "export LITELLM_RATE_LIMIT=$rate_limit" >> ~/.bashrc
            echo "✅ Rate limit set to $rate_limit requests per minute."
            ;;
          5)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      4)
        echo ""
        echo "Advanced Settings:"
        echo "1. Set Custom API Base URL"
        echo "2. Set API Version"
        echo "3. Set Proxy Server"
        echo "4. Enable Logging"
        echo "5. Go Back"
        echo ""
        read -p "Enter your choice (1-5): " advanced_choice

        case $advanced_choice in
          1)
            read -p "Enter the custom API base URL: " api_base_url
            echo "export LITELLM_API_BASE_URL=$api_base_url" >> ~/.bashrc
            echo "✅ Custom API base URL set to $api_base_url."
            ;;
          2)
            read -p "Enter the API version: " api_version
            echo "export LITELLM_API_VERSION=$api_version"
            echo "✅ API version set to $api_version." >> ~/.bashrc
            ;;
          3)
            read -p "Enter the proxy server URL: " proxy_server
            echo "export LITELLM_PROXY_SERVER=$proxy_server" >> ~/.bashrc
            echo "✅ Proxy server URL set to $proxy_server."
            ;;
          4)
            echo "export LITELLM_LOGGING=true" >> ~/.bashrc
            echo "✅ Logging enabled."
            ;;
          5)
            # Return to the main menu or previous menu could be implemented here.
            echo "Returning to the main configuration menu..."
            break
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      5)
        # Break the loop to return to the main menu or end the configuration process
        echo "Returning to the main menu..."
        break
        ;;
      *)
        echo "Invalid choice. Please try again."
        ;;
    esac
  done

  echo "liteLLM configuration completed successfully!"
}

# Function to configure Open Interpreter
configure_open_interpreter() {
  while true; do
    echo ""
    echo "Open Interpreter Configuration Menu:"
    echo "1. Language Models"
    echo "2. Usage Settings"
    echo "3. Safety Settings"
    echo "4. Telemetry Settings"
    echo "5. Interpreter Settings"
    echo "6. Notebook Settings"
    echo "7. Return to Main Menu"
    echo ""
    read -p "Enter your choice (1-7): " open_interpreter_choice

    case $open_interpreter_choice in
      1)
        echo ""
        echo "Language Models:"
        echo "1. Hosted Providers"
        echo "2. Local Providers"
        echo "3. Custom Models"
        echo "4. Go Back"
        echo ""
        read -p "Enter your choice (1-4): " language_models_choice

        case $language_models_choice in
          1)
            echo ""
            echo "Hosted Providers:"
            echo "1. OpenAI"
            echo "2. Anthropic"
            echo "3. Hugging Face"
            echo "4. Go Back"
            echo ""
            read -p "Enter your choice (1-4): " hosted_providers_choice

            case $hosted_providers_choice in
              1)
                read -p "Enter your OpenAI API key: " openai_api_key
                echo "export OPENAI_API_KEY=$openai_api_key" >> ~/.bashrc
                echo "✅ OpenAI API key saved."
                ;;
              2)
                read -p "Enter your Anthropic API key: " anthropic_api_key
                echo "export ANTHROPIC_API_KEY=$anthropic_api_key" >> ~/.bashrc
                echo "✅ Anthropic API key saved."
                ;;
              3)
                read -p "Enter your Hugging Face API key: " huggingface_api_key
                echo "export HUGGINGFACE_API_KEY=$huggingface_api_key" >> ~/.bashrc
                echo "✅ Hugging Face API key saved."
                ;;
              4)
                ;;
              *)
                echo "Invalid choice. Please try again."
                ;;
            esac
            ;;
          2)
            echo ""
            read -p "Enter the path to your local provider: " local_provider_path
            echo "export OPEN_INTERPRETER_LOCAL_PROVIDER=$local_provider_path" >> ~/.bashrc
            echo "✅ Local provider path set to $local_provider_path."
            ;;
          3)
            echo ""
            read -p "Enter the name of the custom model: " custom_model_name
            echo "export OPEN_INTERPRETER_CUSTOM_MODEL=$custom_model_name" >> ~/.bashrc
            echo "✅ Custom model set to $custom_model_name."
            ;;
          4)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      2)
        echo ""
        echo "Usage Settings:"
        echo "1. Code Execution Settings"
        echo "2. Computer API"
        echo "3. Custom Languages"
        echo "4. Protocols"
        echo "5. LMC Messages"
        echo "6. Go Back"
        echo ""
        read -p "Enter your choice (1-6): " usage_settings_choice

        case $usage_settings_choice in
          1)
            read -p "Enter the code execution timeout (in seconds): " code_timeout
            echo "export OPEN_INTERPRETER_CODE_TIMEOUT=$code_timeout" >> ~/.bashrc
            echo "✅ Code execution timeout set to $code_timeout seconds."
            ;;
          2)
            read -p "Enter the computer API endpoint: " computer_api_endpoint
            echo "export OPEN_INTERPRETER_COMPUTER_API=$computer_api_endpoint" >> ~/.bashrc
            echo "✅ Computer API endpoint set to $computer_api_endpoint."
            ;;
          3)
            read -p "Enter the custom language name: " custom_language
            echo "export OPEN_INTERPRETER_CUSTOM_LANGUAGE=$custom_language" >> ~/.bashrc
            echo "✅ Custom language set to $custom_language."
            ;;
          4)
            read -p "Enter the protocol name: " protocol_name
            echo "export OPEN_INTERPRETER_PROTOCOL=$protocol_name" >> ~/.bashrc
            echo "✅ Protocol set to $protocol_name."
            ;;
          5)
            read -p "Enter the LMC message format: " lmc_message_format
            echo "export OPEN_INTERPRETER_LMC_MESSAGE=$lmc_message_format" >> ~/.bashrc
            echo "✅ LMC message format set to $lmc_message_format."
            ;;
          6)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      3)
        echo ""
        echo "Safety Settings:"
        echo "1. Isolation"
        echo "2. Safe Mode"
        echo "3. Best Practices"
        echo "4. Go Back"
        echo ""
        read -p "Enter your choice (1-4): " safety_settings_choice

        case $safety_settings_choice in
          1)
            read -p "Enter the isolation level (low/medium/high): " isolation_level
            echo "export OPEN_INTERPRETER_ISOLATION=$isolation_level" >> ~/.bashrc
            echo "✅ Isolation level set to $isolation_level."
            ;;
          2)
            read -p "Enable safe mode? (yes/no): " enable_safe_mode
            echo "export OPEN_INTERPRETER_SAFE_MODE=$enable_safe_mode" >> ~/.bashrc
            echo "✅ Safe mode ${enable_safe_mode}."
            ;;
          3)
            read -p "Enter the best practices configuration file path: " best_practices_path
            echo "export OPEN_INTERPRETER_BEST_PRACTICES=$best_practices_path" >> ~/.bashrc
            echo "✅ Best practices configuration file set to $best_practices_path."
            ;;
          4)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      4)
        echo ""
        read -p "Enable telemetry? (yes/no): " enable_telemetry
        echo "export OPEN_INTERPRETER_TELEMETRY=$enable_telemetry" >> ~/.bashrc
        echo "✅ Telemetry ${enable_telemetry}."
        ;;
      5)
        echo ""
        echo "Interpreter Settings:"
        echo "1. Interpreter Name"
        echo "2. Interpreter Group"
        echo "3. Interpreter Properties"
        echo "4. Interpreter Dependencies"
        echo "5. Go Back"
        echo ""
        read -p "Enter your choice (1-5): " interpreter_settings_choice

        case $interpreter_settings_choice in
          1)
            read -p "Enter the interpreter name: " interpreter_name
            echo "export OPEN_INTERPRETER_NAME=$interpreter_name" >> ~/.bashrc
            echo "✅ Interpreter name set to $interpreter_name."
            ;;
          2)
            read -p "Enter the interpreter group: " interpreter_group
            echo "export OPEN_INTERPRETER_GROUP=$interpreter_group" >> ~/.bashrc
            echo "✅ Interpreter group set to $interpreter_group."
            ;;
          3)
            read -p "Enter the interpreter properties file path: " interpreter_properties_path
            echo "export OPEN_INTERPRETER_PROPERTIES=$interpreter_properties_path" >> ~/.bashrc
            echo "✅ Interpreter properties file set to $interpreter_properties_path."
            ;;
          4)
            read -p "Enter the interpreter dependencies file path: " interpreter_dependencies_path
            echo "export OPEN_INTERPRETER_DEPENDENCIES=$interpreter_dependencies_path" >> ~/.bashrc
            echo "✅ Interpreter dependencies file set to $interpreter_dependencies_path."
            ;;
          5)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      6)
        echo ""
        echo "Notebook Settings:"
        echo "1. Notebook Dependencies"
        echo "2. SSH Connections"
        echo "3. Cell Execution Notifications"
        echo "4. Go Back"
        echo ""
        read -p "Enter your choice (1-4): " notebook_settings_choice

        case $notebook_settings_choice in
          1)
            read -p "Enter the notebook dependencies file path: " notebook_dependencies_path
            echo "export OPEN_INTERPRETER_NOTEBOOK_DEPENDENCIES=$notebook_dependencies_path" >> ~/.bashrc
            echo "✅ Notebook dependencies file set to $notebook_dependencies_path."
            ;;
          2)
            read -p "Enter the SSH connection details: " ssh_connection_details
            echo "export OPEN_INTERPRETER_SSH_CONNECTION=$ssh_connection_details" >> ~/.bashrc
            echo "✅ SSH connection details set to $ssh_connection_details."
            ;;
          3)
            read -p "Enable cell execution notifications? (yes/no): " enable_cell_notifications
            echo "export OPEN_INTERPRETER_CELL_NOTIFICATIONS=$enable_cell_notifications" >> ~/.bashrc
            echo "✅ Cell execution notifications ${enable_cell_notifications}."
            ;;
          4)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      7)
        echo "Returning to the main menu..."
        break
        ;;
      *)
        echo "Invalid choice. Please try again."
        ;;
    esac
  done

  echo "Open Interpreter configuration completed successfully!"
}

# Function to configure Jupyter
configure_jupyter() {
  setup_venv  # Set up and activate the virtual environment

  while true; do
    echo ""
    echo "Jupyter Configuration Menu:"
    echo "1. Select Notebook Template"
    echo "2. Optimize Jupyter Settings"
    echo "3. Return to Main Menu"
    echo ""
    read -p "Enter your choice (1-3): " jupyter_choice

    case $jupyter_choice in
      1)
        echo ""
        echo "Notebook Templates:"
        echo "1. AI-Powered Data Analysis"
        echo "2. LLM-Based Text Generation"
        echo "3. Machine Learning with Gradio UI"
        echo "4. God Mode (Advanced AI/PyTorch)"
        echo "5. Go Back"
        echo ""
        read -p "Enter your choice (1-5): " template_choice

        case $template_choice in
          1)
            echo "Generating AI-Powered Data Analysis Notebook..."
            source jupyter_venv/bin/activate  # Activate the virtual environment
            interpreter -ci -y "Create a Jupyter notebook for AI-powered data analysis using Open Interpreter and liteLLM. Include data loading, preprocessing, visualization, and insights generation." > data_analysis_notebook.ipynb
            deactivate  # Deactivate the virtual environment
            echo "✅ AI-Powered Data Analysis Notebook generated successfully!"
            ;;
          2)
            echo "Generating LLM-Based Text Generation Notebook..."
            source jupyter_venv/bin/activate  # Activate the virtual environment
            interpreter -ci -y "Create a Jupyter notebook for text generation using liteLLM. Include text loading, preprocessing, fine-tuning, and generation examples." > text_generation_notebook.ipynb
            deactivate  # Deactivate the virtual environment
            echo "✅ LLM-Based Text Generation Notebook generated successfully!"
            ;;
          3)
            echo "Generating Machine Learning with Gradio UI Notebook..."
            source jupyter_venv/bin/activate  # Activate the virtual environment
            interpreter -ci -y "Create a Jupyter notebook for machine learning with a Gradio UI. Include model training, evaluation, and an interactive UI for predictions." > ml_gradio_notebook.ipynb
            deactivate  # Deactivate the virtual environment
            echo "✅ Machine Learning with Gradio UI Notebook generated successfully!"
            ;;
          4)
            echo "Generating God Mode Notebook..."
            source jupyter_venv/bin/activate  # Activate the virtual environment
            interpreter -ci -y "Create a Jupyter notebook for advanced AI and PyTorch applications. Include complex model architectures, training pipelines, and the mergekit library for enhanced functionality." > god_mode_notebook.ipynb
            deactivate  # Deactivate the virtual environment
            echo "✅ God Mode Notebook generated successfully!"
            ;;
          5)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      2)
        echo ""
        echo "Optimizing Jupyter Settings..."
        # Configure Jupyter settings for better performance and usability
        jupyter notebook --generate-config
        echo "c.NotebookApp.open_browser = False" >> ~/.jupyter/jupyter_notebook_config.py
        echo "c.NotebookApp.ip = '0.0.0.0'" >> ~/.jupyter/jupyter_notebook_config.py
        echo "c.NotebookApp.port = 8888" >> ~/.jupyter/jupyter_notebook_config.py
        echo "c.InteractiveShellApp.extensions = ['autoreload']" >> ~/.jupyter/jupyter_notebook_config.py
        echo "c.InteractiveShellApp.exec_lines = ['%autoreload 2']" >> ~/.jupyter/jupyter_notebook_config.py
        echo "✅ Jupyter settings optimized successfully!"
        ;;
      3)
        break
        ;;
      *)
        echo "Invalid choice. Please try again."
        ;;
    esac
  done

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

  while true; do
    echo ""
    echo "Super Coder Menu:"
    echo "1. Create New Application"
    echo "2. Load from Template"
    echo "3. Execution Mode"
    echo "4. Advanced Settings"
    echo "5. Manage Prompt Folder"
    echo "6. Return to Main Menu"
    echo ""
    read -p "Enter your choice (1-6): " super_coder_choice

    case $super_coder_choice in
      1)
        echo ""
        read -p "Enter the name of the new application: " app_name
        mkdir -p "$app_name"
        cd "$app_name" || exit
        echo "✅ New application directory created: $app_name"
        ;;
      2)
        echo ""
        echo "Available Templates:"
        echo "1. PyTorch Application"
        echo "2. Machine Learning Pipeline"
        echo "3. Mergekit Integration"
        echo "4. Go Back"
        echo ""
        read -p "Enter your choice (1-4): " template_choice

        case $template_choice in
          1)
            echo "Loading PyTorch Application template..."
            interpreter -ci "Create a PyTorch application template with basic structure and dependencies." > pytorch_app.py
            echo "✅ PyTorch Application template loaded successfully!"
            ;;
          2)
            echo "Loading Machine Learning Pipeline template..."
            interpreter -ci "Create a machine learning pipeline template with data preprocessing, model training, and evaluation steps." > ml_pipeline.py
            echo "✅ Machine Learning Pipeline template loaded successfully!"
            ;;
          3)
            echo "Loading Mergekit Integration template..."
            interpreter -ci "Create a template that demonstrates the integration of Mergekit library for advanced functionality." > mergekit_integration.py
            echo "✅ Mergekit Integration template loaded successfully!"
            ;;
          4)
            ;;
          *)
            echo "Invalid choice. Please try again."
            ;;
        esac
        ;;
      # ... (rest of the function)
    esac
  done

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
