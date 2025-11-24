# Usage samples for `private-google-genai-samples`

Known limitation: the private samples are only aimed for interactions testing,
reguar sample build is not supported in the private samples

To run the private samples first build the private SDK and the private samples, from the repository root:
./src/private

```sh
# Build the private SDK
cd ./src/private
npm install
npm run build
# come back to the main repository root
cd ../../

# Build the samples
cd sdk-samples-private
npm install
npm run build
```

The samples use key and project settings from environment variables, set the following environment variables prior to invoking samples:

```sh
export GEMINI_API_KEY=<GEMINI_KEY>
export GOOGLE_GENAI_USE_VERTEXAI=false
```

Now you can run the compiled samples, e.g:

```sh
node build/sdk-samples/interactions_with_configs.ts
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