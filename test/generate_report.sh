#!/usr/bin/env bash

#  @license
#  Copyright 2025 Google LLC
#  SPDX-License-Identifier: Apache-2.0

set -ex

WORK_DIR="$(mktemp -d)"
DEFAULT_NYC_OUTPUT_DIR="${PWD}/.nyc_output/"

# Check if tmp dir was created.
if [ ! -d "$WORK_DIR" ]; then
  echo "Could not create temp dir"
  exit 1
fi

# Deletes the temp directory.
function cleanup {
  echo "Cleaning up temp working directory $WORK_DIR" and default output directory for nyc $DEFAULT_NYC_OUTPUT_DIR
  rm -rf "$WORK_DIR"
  rm -Rf DEFAULT_NYC_OUTPUT_DIR
  echo "Deleted temp working directory $WORK_DIR"
}

# Register the cleanup function to be called on the EXIT signal.
trap cleanup EXIT


UNIT=coverage-unit-test
SYSTEM=coverage-system-test
# TODO- b/462434591: Add coverage for interactions tests.
EXCLUDE_FLAGS=(
    "--exclude" "src/interactions/**"
)
# TODO: b/435204110 - Add coverage for table tests.

# Generate the reports for each test suite separately to avoid covering each
# other.
tsc
GOOGLE_API_KEY=googapikey GOOGLE_CLOUD_PROJECT=googcloudproj GOOGLE_CLOUD_LOCATION=googcloudloc
c8 "${EXCLUDE_FLAGS[@]}" --reporter=json --report-dir=./${WORK_DIR}/${UNIT} jasmine dist/test/unit/**/*_test.js dist/test/unit/*_test.js
c8 "${EXCLUDE_FLAGS[@]}" --reporter=json --report-dir=./${WORK_DIR}/${SYSTEM} jasmine dist/test/system/node/*_test.js -- --test-server

# Move all the generated coverage reports to the same directory to merge reports.
mv ./${WORK_DIR}/${UNIT}/coverage-final.json  ./${WORK_DIR}/${UNIT}-coverage-report.json
mv ./${WORK_DIR}/${SYSTEM}/coverage-final.json  ./${WORK_DIR}/${SYSTEM}-coverage-report.json

# Clean up the directory to avoid contamination, nyc will generate this
# directory everytime.
rm -Rf DEFAULT_NYC_OUTPUT_DIR || true

# Merge the reports into one file.
nyc merge ./${WORK_DIR} --output-file=${DEFAULT_NYC_OUTPUT_DIR}/coverage-report.json

# Convert and present the merged report in ./.nyc_output
nyc report --reporter=text --reporter=lcov --report-dir=${DEFAULT_NYC_OUTPUT_DIR}

# Check coverage is above threshold.
nyc check-coverage --lines 50 --statements 50 --functions 39 --branches 75