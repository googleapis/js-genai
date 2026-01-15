#!/usr/bin/env bash

set -ex

pnpm pack

PACKAGE_VERSION=$(jq -r .version package.json)
TARBALL="$(pwd)/google-genai-${PACKAGE_VERSION}.tgz"

# Verify that the tarball exists
if [ ! -f "${TARBALL}" ]; then
  echo "Error: Tarball ${TARBALL} was not created."
  exit 1
fi

echo "Building sdk-samples..."

pushd sdk-samples
pnpm add "${TARBALL}"
NODE_OPTIONS="--max-old-space-size=8192" pnpm run build
popd

# See: no-optional-deps/README.md
echo "Building no-optional-deps..."

TMP_WORKDIR="$(mktemp -d)"
cp -r test/packaging/no-optional-deps/* "${TMP_WORKDIR}"
cd ${TMP_WORKDIR}

pnpm add "${TARBALL}"
NODE_OPTIONS="--max-old-space-size=8192" pnpm run build
