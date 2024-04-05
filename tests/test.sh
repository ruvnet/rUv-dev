#!/bin/bash

# Run the Python script
python3 - <<EOF
from interpreter import interpreter
# Paste your OpenAI API key below.
interpreter.auto_run = True
interpreter.chat("Please print hello world.")
EOF
