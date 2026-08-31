#!/bin/bash
# ----------------------------------------------------------
# @license
# Copyright 2026 Google LLC
# SPDX-License-Identifier: Apache-2.0
# ----------------------------------------------------------

# Fail fast
set -e

pids=()

# Run all api-extractor commands in parallel
npx api-extractor run --local --verbose &
pids+=($!)

npx api-extractor run -c api-extractor.node.json --local --verbose &
pids+=($!)

npx api-extractor run -c api-extractor.web.json --local --verbose &
pids+=($!)

npx api-extractor run -c api-extractor.tokenizer-node.json --local --verbose &
pids+=($!)

npx api-extractor run -c api-extractor.vertex_internal.json --local --verbose &
pids+=($!)

# Wait for all and check exit codes
status=0
for pid in "${pids[@]}"; do
  wait "$pid" || status=$?
done

if [ $status -ne 0 ]; then
  echo "Error: One or more api-extractor runs failed"
  exit $status
fi
