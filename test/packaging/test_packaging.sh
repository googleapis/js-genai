#!/usr/bin/env bash

set -ex

npm pack

PACKAGE_VERSION=$(jq -r .version package.json)
TARBALL="$(pwd)/google-genai-${PACKAGE_VERSION}.tgz"

# Verify that the tarball exists
if [ ! -f "${TARBALL}" ]; then
  echo "Error: Tarball ${TARBALL} was not created."
  exit 1
fi

# npm runs install-time lifecycle scripts on every consumer install.
if tar -xzOf "${TARBALL}" package/package.json \
    | jq -e '(.scripts // {}) | has("preinstall") or has("install") or has("postinstall")' > /dev/null; then
  echo "Error: ${TARBALL} declares an install-time lifecycle script."
  exit 1
fi

echo "Building sdk-samples..."

pushd sdk-samples
npm install "${TARBALL}"
npm run build
popd

# See: no-optional-deps/README.md
echo "Building no-optional-deps..."

TMP_WORKDIR="$(mktemp -d)"
cp -r test/packaging/no-optional-deps/* "${TMP_WORKDIR}"
cd ${TMP_WORKDIR}

npm install "${TARBALL}"
npm run build
