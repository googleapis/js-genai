#!/bin/bash

export GOOGLE_GENAI_CLIENT_MODE=api
export GOOGLE_GENAI_TESTS_SUBDIR=shared
REPLAYS_DIR="$(blaze info workspace 2>/dev/null)/google/cloud/aiplatform/sdk/genai/replays"
export GOOGLE_GENAI_REPLAYS_DIRECTORY="$REPLAYS_DIR"

echo "Replays directory: $GOOGLE_GENAI_REPLAYS_DIRECTORY"
echo "Client mode: $GOOGLE_GENAI_CLIENT_MODE"
echo "Tests subdirectory: $GOOGLE_GENAI_TESTS_SUBDIR"
echo "Running shared table tests in API mode..."
npm install && npx tsc && npx jasmine dist/test/g3/table_test.js && rm -rf dist node_modules temp
