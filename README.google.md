# GenAI JavaScript SDK User Guide (Internal)

go/genai-js-sdk

<!--*
# Document freshness: For more information, see go/fresh-source.
freshness: { owner: 'annieluc' reviewed: '2025-01-07' }
*-->

## Important

### Open bugs and frictions against this [template](https://b.corp.google.com/issues/new?component=962606&template=2062941). It should be assigned to @asobran directly.

### Use this [chat space](https://mail.google.com/mail/u/0/#chat/space/AAAAXILcELs) for questions or ping @annieluc or @yyyu.

*   This doc targets Google's internal developers only.

*   Go through the setup section before running the code.

*   Create a .ts file using the samples of this doc and run the code on this
    doc.

*   Try to test out discovered functionality.

# Module TOC

*   [Prerequisites](#prerequisites)
*   [Models](#models)

Use left nav table of contents to navigate to specific functionality.

# Prerequisites

## Get an API Key to access ML Dev APIs

You need to get an `API key` to be able to call the ML Dev APIs using the
TypeScript SDK module. You can reuse the key that has been used in the
[Python SDK demo Colab](https://colab.research.google.com/drive/1K-RuGeP5WHV9gpGfm6_Gkk_IkTyCc2b0#scrollTo=EULDpjbDJ9LZ).

## Export environment variables

The samples will rely on environment variables to initialize the client.

```bash
export GOOGLE_API_KEY={YOUR_API_KEY}
export GOOGLE_CLOUD_PROJECT={YOUR_CLOUD_PROJECT}
export GOOGLE_CLOUD_LOCATION={YOUR_CLOUD_LOCATION}
```

## Install NPM packages and run the samples

The sample code is located at `./google/genai/sdk-samples` directory. Assuming you
are at the directory `google/genai`, run them as follows:

```shell
# Run the sample against Vertex AI
export GOOGLE_GENAI_USE_VERTEXAI=true && npm install && npm run build && node dist/samples/generate_content_text.js
```

```shell
# Run the sample against ML Dev API
export GOOGLE_GENAI_USE_VERTEXAI=false && npm install && npm run build && node dist/samples/generate_content_text.js
```

You can see all the existing samples by running:

```bash
ls -R samples | grep ".*\.ts$"
```

## See test coverage

To see test coverage, run the following (assuming environment variables are
exported). This report covers the unit and system tests.

```bash
npm run coverage-report
```

# Let's break it down:

## Import

```typescript
import {GoogleAuth, GoogleAuthOptions} from 'google-auth-library';

import {Client} from '../src/client';

import process = require('process');
```

## Create a client

Please use one of the following code blocks to create a client for different
services (MLDev or Vertex). Feel free to switch the client and run all the
examples to see how it behaves under different APIs.

```typescript
// Only use this block for ML Developer API
const client = new Client({vertexai: false, apiKey: GOOGLE_API_KEY});
```

```typescript
// Only use this block for Vertex AI API
const googleAuthOptions: GoogleAuthOptions = {
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
};
const googleAuth = new GoogleAuth(googleAuthOptions);
const client = new Client({
  vertexai: true,
  project: GOOGLE_CLOUD_PROJECT,
  googleAuth: googleAuth,
});
```

## Models

The `client.models` module exposes model inferencing and model getters. Below
are the models that are supported by the Go SDK so far:

```javascript
generateContent(...): Promise<types.GenerateContentResponse>
generateContentStream(...): Promise<AsyncGenerator<types.GenerateContentResponse>>
```

## Generate Content

```typescript
const response = await client.models.generateContent(
    'gemini-2.0-flash',
    'why is the sky blue?',
    {},
);
console.debug(response.text());
```

**Output:**

```the

**1. Sunlight and its Colors:**

* Sunlight, as we know, appears white. However, it's actually made up of all the colors of the rainbow, each with a different wavelength.
* **Wavelength** refers to the distance between the peaks of a light wave. Red light has the longest wavelengths, and violet light has the shortest.

**2. Earth's Atmosphere and Air Molecules:**

* The Earth's atmosphere is primarily composed of nitrogen and oxygen molecules. These molecules are much smaller than the wavelengths of visible light.

**3. Rayleigh Scattering Explained:**

* When sunlight enters the atmosphere, it collides with these tiny air molecules.
* This collision causes the light to be scattered in different directions.
* **Crucially, shorter wavelengths of light (like blue and violet) are scattered much more effectively than longer wavelengths (like red and orange).** This is because the smaller wavelengths are more likely to be absorbed and re-emitted by the small air molecules.
* This preferential scattering of blue and violet light is called Rayleigh scattering.

**4. Why We See Blue and Not Violet:**

* While violet light is scattered even more than blue light, our eyes are less sensitive to violet.
* Additionally, the sun emits slightly less violet light than blue light.
* The combination of these factors results in us seeing a predominantly blue sky.

**In simple terms, think of it like this:**

Imagine you're throwing small balls (light waves) at a bunch of tiny obstacles (air molecules). The small balls (blue and violet light) are more likely to bounce off in many directions, while the larger balls (red and orange light) are more likely to pass through. The scattered small balls (blue and violet light) are what we see in the sky.

**Other Relevant Points:**

* **Why Sunsets and Sunrises are Red/Orange:** When the sun is near the horizon, the sunlight travels through a much longer path in the atmosphere. The blue light is scattered away in all directions, and the red and orange light, which is less scattered, makes it through to our eyes, giving us the beautiful sunsets and sunrises.
* **Why the Sky is Dark at Night:** When the sun is below the horizon, there is no direct sunlight to be scattered, resulting in a dark sky. We do see the stars, which emit their own light.

**In summary, the sky is blue because of the way sunlight interacts with the small air molecules in our atmosphere. This interaction, known as Rayleigh scattering, preferentially scatters shorter wavelengths of light, like blue, in all directions.**
```

## Generate Content Streaming

```typescript
const response = await client.models.generateContentStream(
    'gemini-2.0-flash',
    'tell me a joke',
    {},
)

for await (const chunk of response) {
  console.debug(chunk.text());
}

```

**Output:**

```okay
, here's a joke:

Why don't scientists trust atoms?


Because they make up everything!
```

# Cleanup

Once you're done running the samples, you can clean up the build artifacts by
running:

```bash
rm -rf dist node_modules
```
