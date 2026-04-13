#!/bin/bash

# Script to run Node.js test files listed in a file.

# Treat unset variables as an error when substituting.
set -o nounset
# Pipelines return the exit status of the last command to exit with a non-zero status.
set -o pipefail

LISTING_FILE="js_files_to_run.txt"
BUILD_DIR="build"
FAILED_SAMPLES=() # Track failed samples to log at the end.

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "ERROR: Build directory '$BUILD_DIR' not found." >&2
  exit 1
fi


# Generate sample list (excluding live_server.js since it is blocking)
if [[ ! -f "$LISTING_FILE" ]]; then
  echo "INFO: '$LISTING_FILE' not found. Generating sorted list from '${BUILD_DIR}/*.js'..."
  find "$BUILD_DIR" -maxdepth 1 -name "*.js" ! -name "live_server.js" | sort > "${LISTING_FILE}.tmp"
  mv "${LISTING_FILE}.tmp" "$LISTING_FILE"
  echo "INFO: List generated in '$LISTING_FILE' (live_server.js excluded)."
fi

if [[ ! -s "$LISTING_FILE" ]]; then
    echo "WARNING: '$LISTING_FILE' is empty. No files to run."
    exit 0
fi

echo ""
echo "-----------------------------------------------------------------"
echo "  Running Samples"
echo "-----------------------------------------------------------------"

# Run each sample
while IFS= read -r file_path || [[ -n "$file_path" ]]; do
  if [[ -z "$file_path" ]]; then
    continue # Skip empty lines.
  fi

  echo -e "INFO: Executing 'node $file_path'...\n"

  # Run the node script and filter base64 output so it's easier to read.
  if node "$file_path" 2>&1 | sed -E 's/[a-zA-Z0-9+/=]{500,}/<BASE64_STRING_REMOVED>/g'; then
    echo -e "INFO: Script '$file_path' finished successfully.\n"
  else
    exit_code=$?
    echo "ERROR: Script '$file_path' failed with exit code $exit_code." >&2
    FAILED_SAMPLES+=("$file_path")
  fi

done < "$LISTING_FILE"

# Report Summary
echo ""
echo "-----------------------------------------------------------------"
echo "  Test Summary"
echo "-----------------------------------------------------------------"

if [ ${#FAILED_SAMPLES[@]} -eq 0 ]; then
  echo "✅ All scripts in '$LISTING_FILE' completed successfully."
  exit 0
else
  echo "❌ The following ${#FAILED_SAMPLES[@]} sample(s) failed:"
  for sample in "${FAILED_SAMPLES[@]}"; do
    echo "   - $sample"
  done
  # Exit with a non-zero status to indicate overall failure
  exit 1
fi