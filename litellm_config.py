import os

def configure_litellm():
    while True:
        print("\nliteLLM Configuration Menu:")
        print("1. Select LLM Provider")
        print("2. Set API Keys")
        print("3. Optimization Settings")
        print("4. Advanced Settings")
        print("5. Return to Main Menu")
        litellm_choice = input("Enter your choice (1-5): ")

        if litellm_choice == "1":
            print("\nSelect LLM Provider:")
            print("1. OpenAI")
            print("2. Anthropic")
            print("3. Hugging Face")
            print("4. Cohere")
            print("5. Azure OpenAI")
            print("6. Replicate")
            print("7. Go Back")
            llm_provider_choice = input("Enter your choice (1-7): ")

            if llm_provider_choice == "1":
                os.environ["LITELLM_LLM_PROVIDER"] = "openai"
                print("✅ OpenAI selected as the LLM provider.")
            elif llm_provider_choice == "2":
                os.environ["LITELLM_LLM_PROVIDER"] = "anthropic"
                print("✅ Anthropic selected as the LLM provider.")
            elif llm_provider_choice == "3":
                os.environ["LITELLM_LLM_PROVIDER"] = "huggingface"
                print("✅ Hugging Face selected as the LLM provider.")
            elif llm_provider_choice == "4":
                os.environ["LITELLM_LLM_PROVIDER"] = "cohere"
                print("✅ Cohere selected as the LLM provider.")
            elif llm_provider_choice == "5":
                os.environ["LITELLM_LLM_PROVIDER"] = "azure"
                print("✅ Azure OpenAI selected as the LLM provider.")
            elif llm_provider_choice == "6":
                os.environ["LITELLM_LLM_PROVIDER"] = "replicate"
                print("✅ Replicate selected as the LLM provider.")
            elif llm_provider_choice == "7":
                pass
            else:
                print("Invalid choice. Please try again.")

        elif litellm_choice == "2":
            openai_api_key = input("Enter your OpenAI API key (or press Enter to skip): ")
            anthropic_api_key = input("Enter your Anthropic API key (or press Enter to skip): ")
            huggingface_api_key = input("Enter your Hugging Face API key (or press Enter to skip): ")
            cohere_api_key = input("Enter your Cohere API key (or press Enter to skip): ")
            azure_api_key = input("Enter your Azure OpenAI API key (or press Enter to skip): ")
            replicate_api_key = input("Enter your Replicate API key (or press Enter to skip): ")

            if openai_api_key:
                os.environ["OPENAI_API_KEY"] = openai_api_key
                print("✅ OpenAI API key saved.")
            if anthropic_api_key:
                os.environ["ANTHROPIC_API_KEY"] = anthropic_api_key
                print("✅ Anthropic API key saved.")
            if huggingface_api_key:
                os.environ["HUGGINGFACE_API_KEY"] = huggingface_api_key
                print("✅ Hugging Face API key saved.")
            if cohere_api_key:
                os.environ["COHERE_API_KEY"] = cohere_api_key
                print("✅ Cohere API key saved.")
            if azure_api_key:
                os.environ["AZURE_API_KEY"] = azure_api_key
                print("✅ Azure OpenAI API key saved.")
            if replicate_api_key:
                os.environ["REPLICATE_API_KEY"] = replicate_api_key
                print("✅ Replicate API key saved.")

        elif litellm_choice == "3":
            print("\nOptimization Settings:")
            print("1. Enable Streaming")
            print("2. Set Context Window")
            print("3. Enable Caching")
            print("4. Set Rate Limit (RPM)")
            print("5. Go Back")
            optimization_choice = input("Enter your choice (1-5): ")

            if optimization_choice == "1":
                os.environ["LITELLM_STREAMING"] = "true"
                print("✅ Streaming enabled.")
            elif optimization_choice == "2":
                context_window = input("Enter the context window size: ")
                os.environ["LITELLM_CONTEXT_WINDOW"] = context_window
                print(f"✅ Context window size set to {context_window}.")
            elif optimization_choice == "3":
                os.environ["LITELLM_CACHING"] = "true"
                print("✅ Caching enabled.")
            elif optimization_choice == "4":
                rate_limit = input("Enter the rate limit (requests per minute): ")
                os.environ["LITELLM_RATE_LIMIT"] = rate_limit
                print(f"✅ Rate limit set to {rate_limit} requests per minute.")
            elif optimization_choice == "5":
                pass
            else:
                print("Invalid choice. Please try again.")

        elif litellm_choice == "4":
            print("\nAdvanced Settings:")
            print("1. Set Custom API Base URL")
            print("2. Set API Version")
            print("3. Set Proxy Server")
            print("4. Enable Logging")
            print("5. Go Back")
            advanced_choice = input("Enter your choice (1-5): ")

            if advanced_choice == "1":
                api_base_url = input("Enter the custom API base URL: ")
                os.environ["LITELLM_API_BASE_URL"] = api_base_url
                print(f"✅ Custom API base URL set to {api_base_url}.")
            elif advanced_choice == "2":
                api_version = input("Enter the API version: ")
                os.environ["LITELLM_API_VERSION"] = api_version
                print(f"✅ API version set to {api_version}.")
            elif advanced_choice == "3":
                proxy_server = input("Enter the proxy server URL: ")
                os.environ["LITELLM_PROXY_SERVER"] = proxy_server
                print(f"✅ Proxy server URL set to {proxy_server}.")
            elif advanced_choice == "4":
                os.environ["LITELLM_LOGGING"] = "true"
                print("✅ Logging enabled.")
            elif advanced_choice == "5":
                print("Returning to the main configuration menu...")
                break
            else:
                print("Invalid choice. Please try again.")

        elif litellm_choice == "5":
            print("Returning to the main menu...")
            break

        else:
            print("Invalid choice. Please try again.")

    print("liteLLM configuration completed successfully!")

if __name__ == "__main__":
    configure_litellm()
