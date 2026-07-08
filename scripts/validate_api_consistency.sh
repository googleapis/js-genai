#!/bin/bash

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/.."

# Define the file paths
crossplatform="temp/api-report/genai.api.md"
node="temp/api-report/genai-node.api.md"
web="temp/api-report/genai-web.api.md"


diff1=$(diff "$crossplatform" "$node")

diff2=$(diff "$crossplatform" "$web")

if [ -n "$diff1" ] || [ -n "$diff2" ]; then
  echo "The crossplatform, web, and node APIs must be consistent, found the following difference:"
  if [ -n "$diff1" ]; then
    echo "Difference between $crossplatform and $node:"
    echo "$diff1"
  fi
  if [ -n "$diff2" ]; then
    echo "Difference between $crossplatform and $web:"
    echo "$diff2"
  fi
  exit 1
else
  echo "The API files are identical."
  exit 0
fi
