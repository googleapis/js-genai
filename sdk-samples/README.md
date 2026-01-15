# Usage samples for `@google/genai/node`

To run the samples first build the SDK and the samples, from the repository root:

```sh
# Build the SDK
pnpm install
pnpm run build

# Build the samples
cd sdk-samples
pnpm install
pnpm run build
```

The samples use key and project settings from environment variables, set the following environment variables prior to invoking samples:

```sh
export GEMINI_API_KEY=<GEMINI_KEY>
export GOOGLE_CLOUD_PROJECT=<GOOGLE_CLOUD_PROJECT>
export GOOGLE_CLOUD_LOCATION=<GCP_REGION>
```

Now you can run the compiled samples, e.g:

```sh
node build/sdk-samples/generate_content_with_text.js
```


## Test Run all samples

To test run all samples, first build them following the instructions above,
then run the script:

```
bash run_samples.sh
```

On the first run it will write the list of samples to `js_files_to_run.txt`.
It executes the examples listed in the file top to bottom, exiting if a sample
fails.

To skip a sample on subsequent runs, remove it from the file.