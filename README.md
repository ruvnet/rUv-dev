```             
 _ __ _   ___   __  
| '__| | | \ \ / /  
| |  | |_| |\ V /   
|_|   \__,_| \_/
          
 Ai | God Mode
 AI-Powered Coding Environment

🦄 Starting...
🤖 rUv - Your Intelligent Agent for Creation...
🌐 Global AI Domination Initiated...
```
# rUv-dev: AI-Powered Development Environment 🚀

Welcome to rUv-dev, an innovative development environment that leverages the power of AI to revolutionize your coding experience! 🤖💻

## Quick Start

To quickly start a new codespace with rUv-dev, simply press the "," (comma) key on your keyboard while viewing this repository on GitHub. This will automatically create a new codespace with all the necessary configurations and dotfiles set up for you.

  1. Type "," on your keyboard on GitHub or clone the repo. 
  2. Open ruv_setep.py in Codespace or VScode, run the applicaiton. `1. Choose Install`
  3. After install select `2. Configure environment` and add your LLM keys. 
  4. If you have any API errors, manually setup the keys. `export OPENAI_API_KEY='YOUR_API_KEY'` 

## Introduction

rUv-dev is a cutting-edge Ai development setup for Codespace and VScode that integrates AI-powered tools and utilities to enhance your productivity and creativity. By combining the power of Open Interpreter, Jupyter Notebook, liteLLM, and a curated set of dotfiles, rUv-dev provides a seamless and intelligent development workflow.

## Benefits

- 🚀 Boost your productivity with AI-assisted coding and code generation.
- 🌐 Access a wide range of AI models and libraries, including OpenAI and LiteLLM.
- 📝 Enjoy a streamlined and customizable development environment with preconfigured dotfiles.
- 🔧 Seamlessly integrate AI-powered tools into your existing workflow.
- 🎨 Unleash your creativity by leveraging AI to generate code snippets, solutions, and ideas.
- 🔄 Continuously improve your development process with AI-driven insights and recommendations.

## Improvement to Traditional Development

Traditional development workflows often involve manual coding, searching for solutions, and setting up development environments from scratch. rUv-dev revolutionizes this approach by integrating AI-powered tools and automating repetitive tasks.

With rUv-dev, you can:

- 💬 Use natural language to describe your coding goals, and let AI generate code snippets for you.
- 🔍 Quickly find solutions to coding challenges with AI-powered code search and recommendations.
- 🚀 Set up your development environment effortlessly with preconfigured dotfiles and automated setup scripts.
- 🤝 Collaborate with AI assistants to brainstorm ideas, debug code, and optimize your workflows.

## AI-Based Development with Open Interpreter and Jupyter

At the core of rUv-dev are two powerful tools: Open Interpreter and Jupyter Notebook.

## Features

### liteLLM Integration

rUv-dev seamlessly integrates with liteLLM, a lightweight and efficient library for working with large language models. With liteLLM, you can:

- 🌐 Access a wide range of LLM providers, including OpenAI, Anthropic, Hugging Face, Cohere, Azure OpenAI, and Replicate.
- 🔑 Securely store and manage API keys for different LLM providers.
- 🚀 Optimize LLM performance with features like streaming, caching, and rate limiting.
- 🔧 Customize LLM behavior with advanced settings like context window size, API versions, and proxy servers.

### Open Interpreter Integration

Open Interpreter is a powerful tool that allows you to interact with AI models using natural language. With Open Interpreter, you can:

- 💬 Describe your coding goals in plain English and let AI generate the corresponding code.
- 🌐 Access a wide range of AI models and libraries, including OpenAI and Anthropic.
- 🔧 Customize Open Interpreter's behavior and preferences to suit your coding style.
- 🔒 Ensure secure code execution with isolation and safe mode settings.
- 📊 Integrate with Jupyter Notebook for interactive coding and data visualization.

### Jupyter Notebook

Jupyter Notebook is an interactive development environment that allows you to combine code, visualizations, and explanatory text in a single document. With Jupyter Notebook, you can:

- 📝 Create and share interactive coding notebooks with embedded AI-generated code snippets.
- 📊 Visualize data and results using a variety of charting libraries and tools.
- 🎨 Collaborate with others by sharing and versioning your Jupyter notebooks.

### Setup and Configuration

rUv-dev provides a user-friendly setup script (`setup.sh`) that simplifies the process of setting up and configuring your development environment. With the setup script, you can:

- 🚀 Perform initial setup with guided steps, including cloning the rUv-dev repository and configuring dotfiles.
- 📦 Install required packages and dependencies with a single command.
- 🔧 Configure environment variables and settings for Open Interpreter, liteLLM, and other tools.
- 🎨 Customize your development environment with a variety of options and preferences.

## Running rUv Dev

1. Open a terminal or command prompt.

2. Navigate to the directory where the `ruv_setup.py` script is located using the `cd` command. For example:
   ```
   cd /path/to/ruv_setup.py
   ```

3. Make sure you have Python installed on your system. You can check the Python version by running:
   ```
   python --version
   ```

4. Run the `ruv_setup.py` script with the desired options or without any options to enter interactive mode. Here are some examples:

   - To show the help menu:
     ```
     python ruv_setup.py -h
     ```

   - To install the required packages:
     ```
     python ruv_setup.py -i
     ```

   - To configure the environment variables and settings:
     ```
     python ruv_setup.py -c
     ```

   - To perform the initial setup with guided steps:
     ```
     python ruv_setup.py -s
     ```

   - To configure liteLLM:
     ```
     python ruv_setup.py --llm
     ```

   - To configure Open Interpreter:
     ```
     python ruv_setup.py --oi
     ```

   - To configure Jupyter:
     ```
     python ruv_setup.py --jupyter
     ```

   - To launch Super Coder for automated code generation:
     ```
     python ruv_setup.py --super-coder
     ```

   - To enter interactive mode and choose options from a menu:
     ```
     python ruv_setup.py
     ```

5. Follow the prompts and instructions provided by the script based on the selected options.

   - If you choose to configure the environment (`-c` or `--configure`), you will be prompted to enter your OpenAI API key and Anthropic API key. If you don't have the keys, you can press Enter to skip.

   - If you choose to perform the initial setup (`-s` or `--setup`), the script will clone the rUv-dev repository and perform the necessary configurations.

   - In interactive mode, you can select options from the menu by entering the corresponding number or option name.

6. Once the script finishes executing, it will display success messages and any additional instructions if necessary.

7. If the script mentions sourcing `~/.bashrc` or restarting your terminal, make sure to do so for the changes to take effect globally.

Note: Make sure you have the necessary permissions to run the script and install packages. If you encounter any permission-related issues, you may need to run the script with administrative privileges using `sudo` or as a user with appropriate permissions.

## Using Dotfiles

rUv-dev comes with a curated set of dotfiles that provide a preconfigured and optimized development environment. The dotfiles include configurations for popular tools like Bash, Zsh, Vim, Tmux, and Git.

To use the dotfiles:

1. Clone the rUv-dev repository to your local machine.
2. Run the provided setup script to automatically symlink the dotfiles to your home directory.
3. Customize the dotfiles to suit your preferences by modifying the files in the `dotfiles` directory.
4. Commit and push your changes to your forked repository to keep your dotfiles in sync across machines.

## Customization

rUv-dev is highly customizable and can be tailored to your specific needs. You can:

- ⚙️ Modify the dotfiles to include your preferred configurations and settings.
- 🔧 Customize Open Interpreter's behavior by adjusting its configuration file.
- 🌐 Integrate additional AI models and libraries to expand the capabilities of Open Interpreter.
- 🎨 Create custom Jupyter Notebook templates and styles to match your workflow.

## Advanced Features

rUv-dev offers several advanced features to further enhance your development experience:

- 🔐 Secure storage of sensitive information using encrypted secrets management.
- 🔄 Seamless integration with version control systems like Git for easy collaboration and tracking.
- 🚀 Automated setup and provisioning of development environments using setup scripts.
- 📊 Integration with popular data science and machine learning libraries for advanced analytics and modeling.

## Getting Started

To get started with rUv-dev, follow these steps:

1. Fork the rUv-dev repository to your GitHub account.
2. Press the "," (comma) key while viewing the repository on GitHub to create a new codespace.
3. Customize the dotfiles and configurations to suit your preferences.
4. Start using Open Interpreter and Jupyter Notebook to supercharge your development workflow!


## How The script works.
1. Environment Variables:
   - The script appends the selected configuration options as environment variables to the `~/.bashrc` file.
   - For example, when setting the OpenAI API key, the script appends `export OPENAI_API_KEY=<user_input>` to `~/.bashrc`.
   - Similarly, other configuration options like LLM provider, API keys, optimization settings, and advanced settings are saved as environment variables in `~/.bashrc`.
   - By appending these variables to `~/.bashrc`, they will be available in future shell sessions when the file is sourced.

2. Configuration Files:
   - The script creates configuration files in specific directories to store the selected settings.
   - For Open Interpreter, the script creates a configuration file at `~/.config/open-interpreter/config.yaml` with the selected API keys and model settings.
   - The script also creates a `.env` file in the user's home directory (`~/.env`) to store additional secrets. The contents of this file are then exported as environment variables by appending `export $(grep -v "^#" ~/.env)` to `~/.bashrc`.

3. Jupyter Notebook Configuration:
   - The script generates a Jupyter Notebook configuration file using the command `jupyter notebook --generate-config`.
   - It then appends specific configuration options like `c.NotebookApp.open_browser = False`, `c.NotebookApp.ip = '0.0.0.0'`, and `c.NotebookApp.port = 8888` to the `~/.jupyter/jupyter_notebook_config.py` file.

4. Aliases and Functions:
   - The script defines aliases and functions related to Open Interpreter and Jupyter Notebook.
   - These aliases and functions are appended to the `~/.bashrc` file using the `>>` redirection operator.
   - By sourcing `~/.bashrc` after appending the aliases and functions, they become available in the current shell session.

5. Local Knowledge Base:
   - The script creates a directory `~/kb` to serve as a local knowledge base.
   - It also creates a `README.md` file inside the `~/kb` directory with instructions on how to use the local knowledge base.

6. Tmux Configuration:
   - The script appends an alias `dev` for creating a tmux development session to the `~/.bashrc` file.
   - By sourcing `~/.bashrc` after appending the alias, it becomes available in the current shell session.

7. Local CI/CD Pipeline:
   - The script creates a directory `~/ci-cd` for the local CI/CD pipeline.
   - It creates a `README.md` file inside the `~/ci-cd` directory with instructions on how to use the local CI/CD pipeline.
   - It also creates a `run-tests.sh` script inside the `~/ci-cd` directory with a command to execute the pipeline.

To ensure that the changes take effect, the script sources the `~/.bashrc` file after appending the aliases and functions. However, for the environment variables and other configurations to be available in future shell sessions, the user needs to source `~/.bashrc` or start a new shell session after running the setup script.


## Contributing

We welcome contributions from the community to make rUv-dev even better! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request on the GitHub repository.

## License

rUv-dev is open-source and released under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the code as per the terms of the license.

## Acknowledgements

We would like to thank the open-source community for their valuable contributions and the AI research community for their groundbreaking work that powers rUv-dev.

---

🤖 Happy coding with rUv-dev! Let's revolutionize development together! 🚀
