# Usage samples for `@google/genai/node`

## Quick Start (Development)

To run the samples directly against the source code without a full rebuild, use the development configuration:

```sh
# Install dependencies
npm install --registry=https://registry.npmjs.org
cd sdk-samples
npm install --registry=https://registry.npmjs.org

# Run any sample directly using tsx and the dev config
npx tsx --tsconfig tsconfig.dev.json <sample_name>.ts
```

## Standard Build Workflow

If you prefer to build the project first:

```sh
# Build the SDK
npm install
npm run build

# Build the samples
cd sdk-samples
npm install
npm run build

# Run the compiled sample
node build/<sample_name>.js
```

The samples use key and project settings from environment variables, set the following environment variables prior to invoking samples:

```sh
export GEMINI_API_KEY=<GEMINI_KEY>
export GOOGLE_CLOUD_PROJECT=<GOOGLE_CLOUD_PROJECT>
export GOOGLE_CLOUD_LOCATION=<GCP_REGION>
```

Now you can run the compiled samples, e.g:

```sh
node build/generate_content_with_text.js
```


## Test Run all samples

To run all samples (compiled):

```sh
cd sdk-samples
bash run_samples.sh
```

This script will:
1. Generate a list of all built `.js` files in `build/` (excluding `live_server.js`) into `js_files_to_run.txt`.
2. Execute them sequentially using `node`.
3. Report any failures.

To skip a sample on subsequent runs, remove it from `js_files_to_run.txt`.
