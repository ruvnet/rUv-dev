#!/bin/bash

# Clinerules Manager Script
# This script helps manage .clinerules files by activating or deactivating them

# Constants
RULES_BANK="clinerules-bank"
ACTIVE_RULES_DIR=".clinerules"
BACKUP_DIR=".clinerules-backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
  echo -e "${BLUE}Clinerules Manager${NC}"
  echo "A utility script to manage your Cline rules"
  echo
  echo "Usage:"
  echo "  $0 [command] [options]"
  echo
  echo "Commands:"
  echo "  list                 List all available rule files in the bank"
  echo "  active               List currently active rule files"
  echo "  activate [file]      Activate a specific rule file"
  echo "  deactivate [file]    Deactivate a specific rule file"
  echo "  backup               Backup current active rules"
  echo "  restore              Restore rules from backup"
  echo "  clear                Remove all active rules"
  echo "  help                 Show this help message"
  echo
  echo "Examples:"
  echo "  $0 list"
  echo "  $0 activate frameworks/react.md"
  echo "  $0 deactivate clients/client-a.md"
  echo
}

# Function to list all available rule files
list_available_rules() {
  echo -e "${BLUE}Available Rule Files:${NC}"
  echo
  
  # List client rules
  echo -e "${YELLOW}Client Rules:${NC}"
  find "$RULES_BANK/clients" -name "*.md" -type f | sort | sed 's|'"$RULES_BANK/"'||'
  echo
  
  # List framework rules
  echo -e "${YELLOW}Framework Rules:${NC}"
  find "$RULES_BANK/frameworks" -name "*.md" -type f | sort | sed 's|'"$RULES_BANK/"'||'
  echo
  
  # List project type rules
  echo -e "${YELLOW}Project Type Rules:${NC}"
  find "$RULES_BANK/project-types" -name "*.md" -type f | sort | sed 's|'"$RULES_BANK/"'||'
  echo
  
  # List orchestration rules
  echo -e "${YELLOW}Orchestration Rules:${NC}"
  find "$RULES_BANK/orchestration" -name "*.md" -type f | sort | sed 's|'"$RULES_BANK/"'||'
  echo
}

# Function to list active rules
list_active_rules() {
  if [ ! -d "$ACTIVE_RULES_DIR" ]; then
    echo -e "${RED}No active rules directory found.${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Currently Active Rules:${NC}"
  echo
  find "$ACTIVE_RULES_DIR" -name "*.md" -type f | sort | sed 's|'"$ACTIVE_RULES_DIR/"'||'
  echo
}

# Function to activate a rule
activate_rule() {
  local rule_file="$1"
  
  # Check if the rule file exists
  if [ ! -f "$RULES_BANK/$rule_file" ]; then
    echo -e "${RED}Error: Rule file '$rule_file' not found in the rules bank.${NC}"
    return 1
  fi
  
  # Create active rules directory if it doesn't exist
  if [ ! -d "$ACTIVE_RULES_DIR" ]; then
    mkdir -p "$ACTIVE_RULES_DIR"
    echo -e "${GREEN}Created active rules directory.${NC}"
  fi
  
  # Copy the rule file to the active rules directory
  cp "$RULES_BANK/$rule_file" "$ACTIVE_RULES_DIR/$(basename "$rule_file")"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Activated rule: $rule_file${NC}"
  else
    echo -e "${RED}Failed to activate rule: $rule_file${NC}"
    return 1
  fi
}

# Function to deactivate a rule
deactivate_rule() {
  local rule_file="$1"
  
  # Check if the active rules directory exists
  if [ ! -d "$ACTIVE_RULES_DIR" ]; then
    echo -e "${RED}No active rules directory found.${NC}"
    return 1
  fi
  
  # Check if the rule file exists in the active rules directory
  if [ ! -f "$ACTIVE_RULES_DIR/$(basename "$rule_file")" ]; then
    echo -e "${RED}Error: Rule file '$(basename "$rule_file")' is not currently active.${NC}"
    return 1
  fi
  
  # Remove the rule file from the active rules directory
  rm "$ACTIVE_RULES_DIR/$(basename "$rule_file")"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deactivated rule: $rule_file${NC}"
  else
    echo -e "${RED}Failed to deactivate rule: $rule_file${NC}"
    return 1
  fi
}

# Function to backup active rules
backup_rules() {
  # Check if the active rules directory exists
  if [ ! -d "$ACTIVE_RULES_DIR" ]; then
    echo -e "${RED}No active rules directory found to backup.${NC}"
    return 1
  fi
  
  # Create backup directory if it doesn't exist
  if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
  else
    # Clear existing backup
    rm -rf "$BACKUP_DIR"/*
  fi
  
  # Copy active rules to backup directory
  cp -r "$ACTIVE_RULES_DIR"/* "$BACKUP_DIR"/
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Active rules backed up successfully.${NC}"
  else
    echo -e "${RED}Failed to backup active rules.${NC}"
    return 1
  fi
}

# Function to restore rules from backup
restore_rules() {
  # Check if the backup directory exists
  if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}No backup directory found.${NC}"
    return 1
  fi
  
  # Create active rules directory if it doesn't exist
  if [ ! -d "$ACTIVE_RULES_DIR" ]; then
    mkdir -p "$ACTIVE_RULES_DIR"
  else
    # Clear existing active rules
    rm -rf "$ACTIVE_RULES_DIR"/*
  fi
  
  # Copy backup rules to active rules directory
  cp -r "$BACKUP_DIR"/* "$ACTIVE_RULES_DIR"/
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Rules restored from backup successfully.${NC}"
  else
    echo -e "${RED}Failed to restore rules from backup.${NC}"
    return 1
  fi
}

# Function to clear all active rules
clear_rules() {
  # Check if the active rules directory exists
  if [ ! -d "$ACTIVE_RULES_DIR" ]; then
    echo -e "${RED}No active rules directory found.${NC}"
    return 1
  fi
  
  # Confirm with the user
  read -p "Are you sure you want to remove all active rules? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    return 0
  fi
  
  # Remove all files from the active rules directory
  rm -rf "$ACTIVE_RULES_DIR"/*
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}All active rules have been removed.${NC}"
  else
    echo -e "${RED}Failed to remove active rules.${NC}"
    return 1
  fi
}

# Main script logic
case "$1" in
  list)
    list_available_rules
    ;;
  active)
    list_active_rules
    ;;
  activate)
    if [ -z "$2" ]; then
      echo -e "${RED}Error: No rule file specified.${NC}"
      echo "Usage: $0 activate [file]"
      exit 1
    fi
    activate_rule "$2"
    ;;
  deactivate)
    if [ -z "$2" ]; then
      echo -e "${RED}Error: No rule file specified.${NC}"
      echo "Usage: $0 deactivate [file]"
      exit 1
    fi
    deactivate_rule "$2"
    ;;
  backup)
    backup_rules
    ;;
  restore)
    restore_rules
    ;;
  clear)
    clear_rules
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$1'${NC}"
    show_help
    exit 1
    ;;
esac

exit 0
