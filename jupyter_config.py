from interpreter import interpreter

def configure_jupyter():
    while True:
        print("\nJupyter Configuration Menu:")
        print("1. Select Notebook Template")
        print("2. Optimize Jupyter Settings")
        print("3. Create Notebook from Prompt")
        print("4. Return to Main Menu")
        jupyter_choice = input("Enter your choice (1-4): ")

        if jupyter_choice == "1":
            while True:
                print("\nNotebook Templates:")
                print("1. AI-Powered Data Analysis")
                print("2. LLM-Based Text Generation")
                print("3. Machine Learning with Gradio UI")
                print("4. God Mode (Advanced AI/PyTorch)")
                print("5. Go Back")
                template_choice = input("Enter your choice (1-5): ")

                # Configure interpreter auto-run
                interpreter.auto_run = True

                if template_choice == "1":
                    print("Generating AI-Powered Data Analysis Notebook...")
                    interpreter.chat("Create a Jupyter notebook for AI-powered data analysis using Open Interpreter and liteLLM. Include data loading, preprocessing, visualization, and insights generation.")
                elif template_choice == "2":
                    print("Generating LLM-Based Text Generation Notebook...")
                    interpreter.chat("Create a Jupyter notebook for text generation using liteLLM. Include text loading, preprocessing, fine-tuning, and generation examples.")
                elif template_choice == "3":
                    print("Generating Machine Learning with Gradio UI Notebook...")
                    interpreter.chat("Create a Jupyter notebook for machine learning with a Gradio UI. Include model training, evaluation, and an interactive UI for predictions.")
                elif template_choice == "4":
                    print("Generating God Mode Notebook...")
                    interpreter.chat("Create a Jupyter notebook for advanced AI and PyTorch applications. Include complex model architectures, training pipelines, and the mergekit library for enhanced functionality.")
                elif template_choice == "5":
                    break
                else:
                    print("Invalid choice. Please try again.")

                while True:
                    print("\nDo you want to:")
                    print("1. Continue development")
                    print("2. Get Guidance")
                    print("3. Return to Notebook Templates")
                    print("4. Return to Main Menu")
                    next_choice = input("Enter your choice (1-4): ")

                    if next_choice == "1":
                        print("Continuing development...")
                        interpreter.chat("Continue developing the Jupyter notebook based on the previous instructions.")
                    elif next_choice == "2":
                        print("Providing guidance...")
                        guidance = input("Enter your guidance or additional instructions: ")
                        interpreter.chat(f"Provide guidance for the current step: {guidance}")
                    elif next_choice == "3":
                        break
                    elif next_choice == "4":
                        return
                    else:
                        print("Invalid choice. Please try again.")

        elif jupyter_choice == "2":
            print("\nOptimizing Jupyter Settings...")
            # Assuming shell command execution is intended for real effects
            # Adjust this section as needed to fit your environment setup and security practices
            print("This operation should be executed with proper permissions and understanding of its effects.")
            # os.system("jupyter notebook --generate-config")
            # Additional commands for optimization could be added here

            print("✅ Jupyter settings optimization simulated. Adjust this section to apply real settings.")

        elif jupyter_choice == "3":
            print("\nCreate Notebook from Prompt")
            prompt = input("Enter your prompt to create a notebook: ")
            interpreter.chat(f"Create a Jupyter notebook based on the following prompt: {prompt}")

            while True:
                print("\nDo you want to:")
                print("1. Continue development")
                print("2. Get Guidance")
                print("3. Return to Main Menu")
                next_choice = input("Enter your choice (1-3): ")

                if next_choice == "1":
                    print("Continuing development...")
                    interpreter.chat("Continue developing the Jupyter notebook based on the previous instructions.")
                elif next_choice == "2":
                    print("Providing guidance...")
                    guidance = input("Enter your guidance or additional instructions: ")
                    interpreter.chat(f"Provide guidance for the current step: {guidance}")
                elif next_choice == "3":
                    break
                else:
                    print("Invalid choice. Please try again.")

        elif jupyter_choice == "4":
            print("Returning to the main menu...")
            break
        else:
            print("Invalid choice. Please try again.")

    print("Jupyter configuration completed successfully!")

if __name__ == "__main__":
    configure_jupyter()
