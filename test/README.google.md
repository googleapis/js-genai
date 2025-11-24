# Google GenAI SDK for JavaScript

### How to test my code?

The following instructions show how to run various tests on the JavaScript SDK.
Firstly, navigate to this directory and set up environment variables.

```
cd third_party/javascript/google_genai

gcloud auth application-default login
gcloud auth application-default set-quota-project "YOUR_PROJECT"

export GOOGLE_API_KEY="YOUR_API_KEY"
export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT"
export GOOGLE_CLOUD_LOCATION="YOUR_LOCATION"
export GOOGLE_GENAI_REPLAYS_DIRECTORY="`blaze info workspace`/google/cloud/aiplatform/sdk/genai/replays"

npm install
```

#### Table tests

These are tests that are run against defined methods as defined in
`/google/cloud/aiplatform/sdk/genai/replays/tests`, optionally using replay data
from `GOOGLE_GENAI_REPLAYS_DIRECTORY`.

`npm install && npm run build && npm run table-test`

#### System tests

These are API-dependent tests that are run against the SDK as a whole.

`npm install && npm run build && npm run system-test`

#### Test Server tests

These are system tests that leverage the [Test-Server](https://github.com/google/test-server) framework to record and replay requests sending to the API.

Record mode:
`npm install && npm run build && npm run test-server-tests:record`

Replay mode:
`npm install && npm run build && npm run test-server-tests`

You could use jasmine `fit` or `fdescribe` to generate replay logs for certain tests. Don't forget to revert the changes after generating the replay logs.

Recommendation: Add `Test-Name` header to group requests by test name, See [example setup](http://google3/third_party/javascript/google_genai/test/system/node/chats_test.ts;l=46-63;rcl=786821865), which can make it easier to look up the requests to test mapping.


#### Unit tests

These are standalone tests against specific modules/classes in the SDK.

`npm install && npm run build && npm run unit-test`

### Docs

Generates HTML documentations (in /docs) with TypeDoc

`npm install && npm run build && npm run docs`

### Cleanup

How to clean up your workspace after testing. This is helpful if you run into
weird errors running tests/testing your change. Sometimes outdated
artifacts/configs stay, which will give you false failures.

`rm -rf dist node_modules`.

### Publishing CL

1.  Ensure your workspace is cleaned up by following the instructions above.
1.  Publish the CL as normal. Add `TESTED={test command(s) run}` to the CL
    description.
