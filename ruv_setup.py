#!/usr/bin/env python3

import os
import sys
import subprocess
import argparse
import re

def show_help():
    help_text = """
Usage: ruv_setup.py [-h] [-i] [-c] [-s] [-q] [--llm] [--oi] [--jupyter] [--super-coder]

Options:
  -h, --help                Show help menu
  -i, --install-packages    Install required packages
  -c, --configure           Configure environment variables and settings
  -s, --setup               Perform initial setup with guided steps
  -q, --quit                Quit the setup process
  --llm                     Configure liteLLM
  --oi                      Configure Open Interpreter
  --jupyter                 Configure Jupyter
  --super-coder             Launch Super Coder for automated code generation
"""
    print(help_text)

def error_exit(message):
    print(f"Error: {message}", file=sys.stderr)
    sys.exit(1)

def ask_initial_setup():
    print("It appears the rUv-dev setup has previously been run.")
    reply = input("Do you want to run the initial setup again? (y/N): ")
    if reply.lower() == 'y':
        perform_initial_setup()
    else:
        print("Skipping initial setup. You can run other commands.")

def perform_initial_setup():
    print("🚀 Cloning rUv-dev repository...")
    if os.path.exists(os.path.expanduser("~/.rUv-dev")):
        print("The rUv-dev repository already exists. Skipping clone.")
    else:
        try:
            subprocess.run(["git", "clone", "--bare", "https://github.com/ruvnet/rUv-dev.git", os.path.expanduser("~/.rUv-dev")], check=True)
            print("✅ rUv-dev repository cloned successfully!")
        except subprocess.CalledProcessError:
            error_exit("Failed to clone rUv-dev repo")
    print("🎉 rUv-dev setup completed successfully!")

def perform_configuration():
    print("🔌 Applying rUv-dev configurations...")

    print("📂 Creating necessary directories...")
    os.makedirs(os.path.expanduser("~/dotfiles/aliases"), exist_ok=True)
    os.makedirs(os.path.expanduser("~/dotfiles/bash"), exist_ok=True)
    os.makedirs(os.path.expanduser("~/dotfiles/git"), exist_ok=True)
    os.makedirs(os.path.expanduser("~/dotfiles/secrets"), exist_ok=True)
    os.makedirs(os.path.expanduser("~/dotfiles/tmux"), exist_ok=True)
    os.makedirs(os.path.expanduser("~/dotfiles/vim"), exist_ok=True)
    os.makedirs(os.path.expanduser("~/dotfiles/zsh"), exist_ok=True)
    print("✅ Directories created successfully!")

    print("🔗 Symlinking dotfiles...")
    dotfiles = [
        ("~/.rUv-dev/dotfiles/aliases/.aliases", "~/dotfiles/aliases/.aliases"),
        ("~/.rUv-dev/dotfiles/aliases/.aliases_work", "~/dotfiles/aliases/.aliases_work"),
        ("~/.rUv-dev/dotfiles/bash/.bashrc", "~/dotfiles/bash/.bashrc"),
        ("~/.rUv-dev/dotfiles/bash/.bash_profile", "~/dotfiles/bash/.bash_profile"),
        ("~/.rUv-dev/dotfiles/git/.gitconfig", "~/dotfiles/git/.gitconfig"),
        ("~/.rUv-dev/dotfiles/secrets/.secrets", "~/dotfiles/secrets/.secrets"),
        ("~/.rUv-dev/dotfiles/secrets/.secrets_work", "~/dotfiles/secrets/.secrets_work"),
        ("~/.rUv-dev/dotfiles/tmux/.tmux.conf", "~/dotfiles/tmux/.tmux.conf"),
        ("~/.rUv-dev/dotfiles/vim/.vimrc", "~/dotfiles/vim/.vimrc"),
        ("~/.rUv-dev/dotfiles/zsh/.zshrc", "~/dotfiles/zsh/.zshrc")
    ]
    for source, target in dotfiles:
        source_path = os.path.expanduser(source)
        target_path = os.path.expanduser(target)
        try:
            os.symlink(source_path, target_path)
        except FileExistsError:
            print(f"Symlink already exists: {target_path}. Skipping...")
    print("✅ Dotfiles symlinked successfully!")

    print("🐚 Sourcing shell files...")
    bashrc_path = os.path.expanduser("~/dotfiles/bash/.bashrc")
    if os.path.exists(bashrc_path):
        subprocess.run(["bash", "-c", f"source {bashrc_path}"])
    else:
        print("Warning: ~/dotfiles/bash/.bashrc not found", file=sys.stderr)
    zshrc_path = os.path.expanduser("~/dotfiles/zsh/.zshrc")
    if os.path.exists(zshrc_path):
        subprocess.run(["zsh", "-c", f"source {zshrc_path}"])
    else:
        print("Warning: ~/dotfiles/zsh/.zshrc not found", file=sys.stderr)
    print("✅ Shell files sourced successfully!")

    # Set up environment variables
    openai_api_key = input("Enter your OpenAI API key (or press Enter to skip): ")
    anthropic_api_key = input("Enter your Anthropic API key (or press Enter to skip): ")

    # Approach 1: Export environment variables directly
    os.environ["OPENAI_API_KEY"] = openai_api_key
    os.environ["ANTHROPIC_API_KEY"] = anthropic_api_key

    # Approach 2: Append environment variables to .bashrc for future sessions
    with open(os.path.expanduser("~/.bashrc"), "a") as bashrc:
        if openai_api_key:
            bashrc.write(f"export OPENAI_API_KEY='{openai_api_key}'\n")
        if anthropic_api_key:
            bashrc.write(f"export ANTHROPIC_API_KEY='{anthropic_api_key}'\n")

    # Check if the exported values match the entered values
    if os.environ.get("OPENAI_API_KEY") != openai_api_key or os.environ.get("ANTHROPIC_API_KEY") != anthropic_api_key:
        print("Approach 1 failed. Trying Approach 2...")
        subprocess.run(["bash", "-c", "source ~/.bashrc"])

        # Check if the exported values match the entered values after sourcing .bashrc
        if os.environ.get("OPENAI_API_KEY") != openai_api_key or os.environ.get("ANTHROPIC_API_KEY") != anthropic_api_key:
            print("Approach 2 failed. Please set the API keys manually by following these steps:")
            print("1. Open ~/.bashrc file in a text editor")
            print("2. Add the following lines at the end of the file:")
            print("   export OPENAI_API_KEY='your_openai_api_key'")
            print("   export ANTHROPIC_API_KEY='your_anthropic_api_key'")
            print("3. Save the file and restart your terminal or run 'source ~/.bashrc'")
        else:
            print("API keys set successfully using Approach 2.")
    else:
        print("API keys set successfully using Approach 1.")

    # Configure Open Interpreter
    os.makedirs(os.path.expanduser("~/.config/open-interpreter"), exist_ok=True)
    with open(os.path.expanduser("~/.config/open-interpreter/config.yaml"), "w") as config_file:
        config_file.write(f"""open_ai:
  api_key: {openai_api_key}
  model: gpt-4
anthropic:
  api_key: {anthropic_api_key}
  model: claude-v1
interpreter:
  streaming: true
  safe_mode: true
""")

    with open(os.path.expanduser("~/.bashrc"), "a") as bashrc:
        bashrc.write("alias oi=\"interpreter\"\n")
        bashrc.write("alias oic=\"interpreter --config\"\n")
        bashrc.write("alias jnb=\"jupyter notebook\"\n")
        bashrc.write("function oip() { interpreter \"$1\" | less; }\n")
        bashrc.write("function oie() { interpreter \"$1\" > \"${2:-output.py}\"; }\n")
    subprocess.run(["bash", "-c", "source ~/.bashrc"])

    with open(os.path.expanduser("~/.env"), "w") as env_file:
        env_file.write("SOME_OTHER_SECRET=value\n")
    with open(os.path.expanduser("~/.bashrc"), "a") as bashrc:
        bashrc.write("export $(grep -v \"^#\" ~/.env)\n")

    subprocess.run(["jupyter", "notebook", "--generate-config"])
    with open(os.path.expanduser("~/.jupyter/jupyter_notebook_config.py"), "a") as jupyter_config:
        jupyter_config.write("c.NotebookApp.open_browser = False\n")
        jupyter_config.write("c.NotebookApp.ip = '0.0.0.0'\n")
        jupyter_config.write("c.NotebookApp.port = 8888\n")

    os.makedirs(os.path.expanduser("~/kb"), exist_ok=True)
    with open(os.path.expanduser("~/kb/README.md"), "w") as readme:
        readme.write("To use the local knowledge base, add text files to the ~/kb directory.\n")

    with open(os.path.expanduser("~/.bashrc"), "a") as bashrc:
        bashrc.write("alias dev=\"tmux new-session -d -s dev \; split-window -v -p 30 \; split-window -h \; attach\"\n")
    subprocess.run(["bash", "-c", "source ~/.bashrc"])

    os.makedirs(os.path.expanduser("~/ci-cd"), exist_ok=True)
    with open(os.path.expanduser("~/ci-cd/README.md"), "w") as readme:
        readme.write("""To use the local CI/CD pipeline:
1. Add your test scripts to the ~/ci-cd directory.
2. Configure your deployment scripts in ~/ci-cd/deploy.sh.
3. Run 'bash ~/ci-cd/run-tests.sh' to execute the pipeline.
""")
    with open(os.path.expanduser("~/ci-cd/run-tests.sh"), "w") as run_tests:
        run_tests.write("interpreter \"$1\" > output.py && python output.py\n")

    print("🎉 rUv-dev setup completed successfully!")
    print("🤖 rUv is ready to assist you in creating anything!")
    print("💪 Let's embark on a journey of innovation and creativity!")

def configure_litellm():
    subprocess.run(["python3", "litellm_config.py"])

def configure_open_interpreter():
    subprocess.run(["python3", "open_interpreter_config.py"])

def configure_jupyter():
    # Path to your jupyter_config.py file
    jupyter_config_path = "jupyter_config.py"
    try:
        # Attempt to run the jupyter_config.py script
        subprocess.run(["python3", jupyter_config_path], check=True)
        print("Virtual environment deactivated.")
        print("✅ Jupyter configuration completed successfully!")
    except subprocess.CalledProcessError as e:
        # Handle errors in the subprocess execution, for example, if jupyter_config.py encounters an error
        print("Failed to configure Jupyter Notebook:", e)

def launch_super_coder():
    subprocess.run(["python3", "super_coder.py"])
    print("Super Coder session completed successfully!")

def main():
    parser = argparse.ArgumentParser(description="Set up rUv-dev environment")
    parser.add_argument("-i", "--install-packages", action="store_true", help="Install required packages")
    parser.add_argument("-c", "--configure", action="store_true", help="Configure environment variables and settings")
    parser.add_argument("-s", "--setup", action="store_true", help="Perform initial setup with guided steps")
    parser.add_argument("-q", "--quit", action="store_true", help="Quit the setup process")
    parser.add_argument("--llm", action="store_true", help="Configure liteLLM")
    parser.add_argument("--oi", action="store_true", help="Configure Open Interpreter")
    parser.add_argument("--jupyter", action="store_true", help="Configure Jupyter")
    parser.add_argument("--super-coder", action="store_true", help="Launch Super Coder for automated code generation")
    args = parser.parse_args()

    if args.quit:
        print("Quitting setup...")
        sys.exit(0)

    if args.install_packages:
        print("🤖 Starting Install Process...")
        subprocess.run(["pip", "install", "open-interpreter", "notebook", "openai", "litellm", "matplotlib", "numpy", "pandas", "pillow", "requests", "beautifulsoup4", "scikit-learn", "tensorflow", "pydantic>=1.0.0,<2.0.0"])

    if args.configure:
        print("🔌 Applying rUv-dev configurations...")
        perform_configuration()

    if args.setup:
        if os.path.exists(os.path.expanduser("~/.rUv-dev")):
            ask_initial_setup()
        else:
            perform_initial_setup()
            perform_configuration()

    if args.llm:
        print("🔧 Configuring liteLLM...")
        configure_litellm()

    if args.oi:
        print("🔧 Configuring Open Interpreter...")
        configure_open_interpreter()

    if args.jupyter:
        print("🔧 Configuring Jupyter...")
        configure_jupyter()

    if args.super_coder:
        print("🚀 Launching Super Coder...")
        launch_super_coder()

    if not any(vars(args).values()):
        print("Entering interactive mode...")
        while True:
            print("\nAvailable options:")
            print("1. Install packages")
            print("2. Configure environment")
            print("3. Perform initial setup")
            print("4. Configure liteLLM")
            print("5. Configure Open Interpreter")
            print("6. Jupyter Notebooks")
            print("7. Launch Super Coder")
            print("8. Quit setup")
            choice = input("Enter an option (h for help): ")

            if choice == "1":
                print("🤖 Starting Install Process")
                subprocess.run(["pip", "install", "open-interpreter", "notebook", "openai", "litellm", "matplotlib", "numpy", "pandas", "pillow", "requests", "beautifulsoup4", "scikit-learn", "tensorflow", "pydantic>=1.0.0,<2.0.0"])
            elif choice == "2":
                print("🔌 Applying rUv-dev configurations...")
                perform_configuration()
            elif choice == "3":
                if os.path.exists(os.path.expanduser("~/.rUv-dev")):
                    ask_initial_setup()
                else:
                    perform_initial_setup()
                    perform_configuration()
            elif choice == "4":
                print("🔧 Configuring liteLLM...")
                configure_litellm()
            elif choice == "5":
                print("🔧 Configuring Open Interpreter...")
                configure_open_interpreter()
            elif choice == "6":
                print("🔧 Configuring Jupyter...")
                configure_jupyter()
            elif choice == "7":
                print("🚀 Launching Super Coder...")
                launch_super_coder()
            elif choice == "8":
                print("Quitting setup...")
                sys.exit(0)
            else:
                print("Invalid choice. Please try again or enter 'h' for help.")


if __name__ == "__main__":
    print("""
                                
 _ __ _   ___   __  
| '__| | | \ \ / /  
| |  | |_| |\ V /   
|_|   \__,_| \_/              
""")
    print("🤖 rUv - Your Intelligent Agent for Creation")
    print("🌐 Global AI Domination Initiated...")
    print("")

    main()
