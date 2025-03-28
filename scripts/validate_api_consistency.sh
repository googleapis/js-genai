#!/bin/bash

# ----------------------------------------------------------
# @license
# Copyright 2025 Google LLC
# SPDX-License-Identifier: Apache-2.0
# ----------------------------------------------------------

# Define the file paths
crossplatform="api-report/genai.api.md"
node="api-report/genai-node.api.md"
web="api-report/genai-web.api.md"


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
