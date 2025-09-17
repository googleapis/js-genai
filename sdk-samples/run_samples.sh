#!/bin/bash

# Script to run Node.js test files listed in a file.

# Exit immediately if a command exits with a non-zero status.
set -o errexit
# Treat unset variables as an error when substituting.
set -o nounset
# Pipelines return the exit status of the last command to exit with a non-zero status.
set -o pipefail

LISTING_FILE="js_files_to_run.txt"
BUILD_DIR="build/sdk-samples"

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "ERROR: Build directory '$BUILD_DIR' not found." >&2
  exit 1
fi

# Create the listing file if it doesn't exist.
# It will contain all .js files directly within the BUILD_DIR, sorted alphabetically.
if [[ ! -f "$LISTING_FILE" ]]; then
  echo "INFO: '$LISTING_FILE' not found. Generating sorted list from '${BUILD_DIR}/*.js'..."
  # Use find to list files, one per line, and pipe to sort.
  # This assumes filenames do not contain newline characters.
  find "$BUILD_DIR" -maxdepth 1 -name "*.js" | sort > "${LISTING_FILE}.tmp"
  mv "${LISTING_FILE}.tmp" "$LISTING_FILE"
  echo "INFO: List generated in '$LISTING_FILE'."
fi

if [[ ! -s "$LISTING_FILE" ]]; then
    echo "WARNING: '$LISTING_FILE' is empty. No files to run."
    exit 0
fi

echo "INFO: Running scripts listed in '$LISTING_FILE'..."

# Read each file path from the listing file, line by line.
while IFS= read -r file_path || [[ -n "$file_path" ]]; do
  if [[ -z "$file_path" ]]; then
    continue # Skip empty lines.
  fi

  echo "INFO: Executing 'node $file_path'..."
  if node "$file_path"; then
    echo "INFO: Script '$file_path' finished successfully."
  else
    error_code=$?
    echo "ERROR: Script '$file_path' failed with exit code $error_code." >&2
    exit "$error_code"
  fi

done < "$LISTING_FILE"

echo "INFO: All scripts in '$LISTING_FILE' completed successfully."
