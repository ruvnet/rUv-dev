#!/usr/bin/env python3

import subprocess
import os
import sys
from pathlib import Path
import re
import logging
import difflib
import shlex
from typing import Dict, List, Optional, Union
import json
from datetime import datetime
import stat

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Add file handler to save logs
try:
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    file_handler = logging.FileHandler(log_dir / f"fix_cycle_{datetime.now():%Y%m%d}.log")
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(file_handler)
except Exception as e:
    logger.warning(f"Failed to set up file logging: {e}")

class FixCycle:
    def __init__(self, files, message, max_attempts=3, timeout=300):
        if not message or not isinstance(message, str):
            raise ValueError("Message must be a non-empty string")
        
        # Validate and sanitize message
        if len(message) > 1000:  # Reasonable limit for message length
            raise ValueError("Message too long")
        if not re.match(r'^[\w\s\-_.,!?()]+$', message):
            raise ValueError("Message contains invalid characters")
            
        self.message = message
        self.timeout = timeout
        self.max_attempts = max_attempts
        
        # Check for OpenAI API key
        if not os.environ.get('OPENAI_API_KEY'):
            raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it before running this script.")
        
        # Sanitize and validate file paths
        self.files = []
        base_dir = Path.cwd().resolve()
        for f in files:
            try:
                # Convert to absolute path
                path = Path(f).resolve()
                # Check if file exists relative to current directory first
                if not path.exists() and not Path(base_dir / f).exists():
                    raise ValueError(f"File not found: {f}")
                
                # Use the relative path if it exists, otherwise use absolute path
                path = (base_dir / f).resolve() if Path(base_dir / f).exists() else path
                
                if not path.is_file():
                    raise ValueError(f"Path is not a file: {f}")
                if not os.access(path, os.R_OK | os.W_OK):
                    raise PermissionError(f"Insufficient permissions for file: {f}")
                # Validate file extension
                if path.suffix not in {'.py', '.js', '.cpp', '.c', '.h', '.hpp', '.java'}:
                    raise ValueError(f"Unsupported file type: {path.suffix}")
                self.files.append(str(path))
            except Exception as e:
                logger.error(f"Failed to validate file {f}: {e}")
                raise
            
        self.message = message
        self.max_attempts = max_attempts
        self.original_contents = {}
        self._store_original_contents()

    def _store_original_contents(self):
        """Store original file contents for later comparison"""
        for file in self.files:
            try:
                with open(file, 'r') as f:
                    self.original_contents[file] = f.readlines()
            except Exception as e:
                logger.error(f"Failed to read original content of {file}: {e}")

    def _generate_diff_summary(self, file_path):
        """Generate a human-readable summary of changes made to a file"""
        try:
            with open(file_path, 'r') as f:
                new_content = f.readlines()

            original = self.original_contents.get(file_path, [])
            diff = list(difflib.unified_diff(original, new_content, lineterm=''))
            
            if not diff:
                return "No changes made to file."

            changes = {
                'added': [],
                'removed': [],
                'modified': []
            }

            for line in diff:
                if line.startswith('+') and not line.startswith('+++'):
                    changes['added'].append(line[1:].strip())
                elif line.startswith('-') and not line.startswith('---'):
                    changes['removed'].append(line[1:].strip())

            # Identify modified lines (lines that were both removed and added)
            for r_line in changes['removed']:
                for a_line in changes['added']:
                    if difflib.SequenceMatcher(None, r_line, a_line).ratio() > 0.5:
                        changes['modified'].append((r_line, a_line))

            summary = []
            if changes['added']:
                summary.append("\nAdded:")
                for line in changes['added']:
                    if not any(line in mod[1] for mod in changes['modified']):
                        if 'import' in line:
                            summary.append(f"  - New import: {line}")
                        elif 'class' in line:
                            summary.append(f"  - New class: {line.split('class ')[1].split('(')[0]}")
                        elif 'def' in line:
                            summary.append(f"  - New function: {line.split('def ')[1].split('(')[0]}")
                        else:
                            summary.append(f"  - {line[:100]}...")

            if changes['modified']:
                summary.append("\nModified:")
                for old, new in changes['modified']:
                    if 'def' in old and 'def' in new:
                        summary.append(f"  - Updated function: {old.split('def ')[1].split('(')[0]}")
                    elif len(old) < 100:
                        summary.append(f"  - Changed: {old} → {new}")
                    else:
                        summary.append(f"  - Modified long line containing: {old[:50]}...")

            if changes['removed']:
                summary.append("\nRemoved:")
                for line in changes['removed']:
                    if not any(line in mod[0] for mod in changes['modified']):
                        if len(line) < 100:
                            summary.append(f"  - {line}")
                        else:
                            summary.append(f"  - {line[:50]}...")

            return "\n".join(summary)

        except Exception as e:
            return f"Failed to generate diff summary: {e}"

    def run_fix_cycle(self):
        """Run fix cycle using aider with direct message passing"""
        attempts = 0
        while attempts < self.max_attempts:
            logger.info(f"\nAttempt {attempts + 1}/{self.max_attempts}")
            
            try:
                # Apply fixes using aider with direct message passing
                logger.info("Applying fixes with aider")
                logger.info(f"Files to process: {', '.join(self.files)}")
                logger.info(f"Message to aider: {self.message}")
                
                # Construct command with proper escaping
                # Sanitize command arguments
                if not re.match(r'^[a-zA-Z0-9\s\-_.,]+$', self.message):
                    raise ValueError("Message contains invalid characters")
                    
                cmd = ["aider", "--yes-always"]
                cmd.extend(self.files)
                cmd.extend(["--message", self.message])
                
                # Validate each argument
                for arg in cmd:
                    if not isinstance(arg, str) or ';' in arg or '&' in arg or '|' in arg:
                        raise ValueError(f"Invalid command argument: {arg}")
                
                logger.info(f"Executing command: {' '.join(cmd)}")
                
                # Use a more secure subprocess configuration
                # Check if aider is installed
                try:
                    subprocess.run(["aider", "--version"], 
                                 capture_output=True, 
                                 check=True)
                except (subprocess.SubprocessError, FileNotFoundError):
                    logger.error("aider is not installed. Please install it with: pip install aider-chat")
                    return False

                # Run aider with real-time output processing
                # Create a restricted environment for subprocess
                restricted_env = {
                    'PATH': os.environ.get('PATH', ''),
                    'PYTHONPATH': os.environ.get('PYTHONPATH', ''),
                    'HOME': os.environ.get('HOME', ''),
                    'LANG': os.environ.get('LANG', 'en_US.UTF-8'),
                    'OPENAI_API_KEY': os.environ.get('OPENAI_API_KEY', '')  # Pass through API key
                }
                
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    shell=False,
                    env=restricted_env,
                    cwd=os.getcwd(),
                    bufsize=1,
                    universal_newlines=True,
                    start_new_session=True  # Isolate the process group
                )

                logger.info("Aider process started - waiting for output...")
                
                stdout_chunks = []
                stderr_chunks = []
                
                try:
                    while True:
                        try:
                            # Read output and error streams with timeout
                            stdout_data = process.stdout.readline()
                            stderr_data = process.stderr.readline()
                            
                            if stdout_data:
                                logger.info(f"Aider output: {stdout_data.strip()}")
                                stdout_chunks.append(stdout_data)
                            if stderr_data:
                                logger.warning(f"Aider error: {stderr_data.strip()}")
                                stderr_chunks.append(stderr_data)
                            
                            # Check if process has finished
                            if process.poll() is not None:
                                break
                                
                        except KeyboardInterrupt:
                            logger.warning("Received keyboard interrupt, terminating aider process...")
                            process.terminate()
                            try:
                                process.wait(timeout=5)  # Give it 5 seconds to terminate gracefully
                            except subprocess.TimeoutExpired:
                                process.kill()  # Force kill if it doesn't terminate
                            raise
                    
                    # Get any remaining output with timeout
                    try:
                        remaining_stdout, remaining_stderr = process.communicate(timeout=30)
                    except subprocess.TimeoutExpired:
                        logger.error("Process communication timed out, terminating...")
                        process.kill()
                        remaining_stdout, remaining_stderr = process.communicate()
                except subprocess.TimeoutExpired:
                    logger.error("Timeout while reading aider output")
                    process.kill()
                    remaining_stdout, remaining_stderr = process.communicate()
                if remaining_stdout:
                    logger.info(f"Final output: {remaining_stdout}")
                    stdout_chunks.append(remaining_stdout)
                if remaining_stderr:
                    logger.warning(f"Final error: {remaining_stderr}")
                    stderr_chunks.append(remaining_stderr)
                    
                # Check if process was killed
                if process.returncode == -9:  # SIGKILL
                    logger.error("Process was killed due to timeout")
                    return False

                result = subprocess.CompletedProcess(
                    args=cmd,
                    returncode=process.returncode,
                    stdout=''.join(stdout_chunks),
                    stderr=''.join(stderr_chunks)
                )
                
                if result.returncode == 0:
                    logger.info("Aider completed successfully")
                    logger.info("Aider output:")
                    if result.stdout:
                        logger.info(result.stdout)
                    
                    # Generate and log summary of changes
                    logger.info("\nSummary of changes made:")
                    for file in self.files:
                        logger.info(f"\nChanges in {file}:")
                        summary = self._generate_diff_summary(file)
                        logger.info(summary)
                    
                    self._update_changelog()
                    return True
                
                logger.error(f"Aider failed with return code {result.returncode}")
                if result.stdout:
                    logger.error(f"Output: {result.stdout}")
                if result.stderr:
                    logger.error(f"Error: {result.stderr}")
                logger.error("Try running aider manually to debug the issue")
                
            except subprocess.TimeoutExpired:
                logger.error("Fix cycle step timed out")
            except subprocess.CalledProcessError as e:
                logger.error(f"Error during fix cycle: {e}")
                if e.stdout:
                    logger.error(f"Stdout: {e.stdout}")
                if e.stderr:
                    logger.error(f"Stderr: {e.stderr}")
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
            
            attempts += 1
            
        logger.error(f"Fix cycle failed after {attempts} attempts")
        return False

    def _update_changelog(self):
        """Update CHANGELOG.md with fix details"""
        # Sanitize file paths for display
        safe_files = [os.path.basename(f) for f in self.files]
        files_str = ", ".join(safe_files)
        
        # Generate summary of changes for changelog
        changelog_details = []
        for file in self.files:
            summary = self._generate_diff_summary(file)
            if summary and summary != "No changes made to file.":
                changelog_details.append(f"\nChanges in {file}:{summary}")
        
        changelog_entry = f"""
## Security Fix
- Applied security fixes to: {files_str}
- Changes made based on provided instructions
{"".join(changelog_details)}
"""
        changelog_path = Path("CHANGELOG.md").resolve()
        if not changelog_path.parent.samefile(Path.cwd()):
            raise ValueError("CHANGELOG.md must be in current directory")
            
        try:
            # Create with secure permissions if new
            if not changelog_path.exists():
                changelog_path.touch(mode=0o644)
            
            # Verify file permissions
            current_mode = os.stat(changelog_path).st_mode
            if current_mode & (stat.S_IWOTH | stat.S_IWGRP):
                logger.warning("Insecure CHANGELOG.md permissions detected")
                os.chmod(changelog_path, 0o644)
            
            # Validate file size before writing
            if changelog_path.exists() and changelog_path.stat().st_size > 10 * 1024 * 1024:  # 10MB limit
                raise ValueError("Changelog file too large")
                
            # Validate content before writing
            safe_entry = changelog_entry.encode('utf-8', errors='replace').decode('utf-8')
            if len(safe_entry) > 100000:  # Reasonable entry size limit
                raise ValueError("Changelog entry too large")
                
            # Write with exclusive creation for atomic operation
            temp_path = changelog_path.with_suffix('.tmp')
            try:
                # Open with strict permissions
                fd = os.open(temp_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
                with os.fdopen(fd, 'w') as f:
                    f.write(safe_entry)
                # Atomic rename
                os.replace(temp_path, changelog_path)
            finally:
                # Cleanup temp file if something went wrong
                if temp_path.exists():
                    temp_path.unlink()
        except Exception as e:
            logger.error(f"Failed to update changelog: {e}")

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Run fix cycle with direct message passing to aider')
    parser.add_argument('files', nargs='*', help='Files to fix')
    parser.add_argument('--message', help='Message to pass directly to aider')
    parser.add_argument('--max-attempts', type=int, default=3, help='Maximum fix attempts')
    
    args = parser.parse_args()
    
    # Default values if not provided
    if not args.files:
        # Use the current script's path as default
        args.files = [str(Path(__file__).resolve())]
    if not args.message:
        args.message = "Review this code for security issues and propose fixes"
    
    try:
        fixer = FixCycle(
            files=args.files,
            message=args.message,
            max_attempts=args.max_attempts
        )
        
        success = fixer.run_fix_cycle()
        return 0 if success else 1
    except ValueError as e:
        logger.error(str(e))
        return 1

if __name__ == "__main__":
    exit(main())
