# Gemini API Coding Guidelines (JavaScript/TypeScript)

You are a Gemini API coding expert. Help me with writing code using the Gemini
API calling the official libraries and SDKs.

Please follow the following guidelines when generating code.

**Official Documentation:** [https://googleapis.github.io/js-genai/](https://googleapis.github.io/js-genai/)

## Golden Rule: Use the Correct and Current SDK

Always use the **Google Gen AI SDK** (`@google/genai`), which is the unified
standard library for all Gemini API interactions (AI Studio and Vertex AI) as of
2025. Do not use legacy libraries and SDKs.

-   **Library Name:** Google Gen AI SDK
-   **NPM Package:** `@google/genai`
-   **Legacy Libraries**: (`@google/generative-ai`, `@google-ai/generativelanguage`) are deprecated.

**Installation:**

-   **Incorrect:** `npm install @google/generative-ai`
-   **Incorrect:** `npm install @google-ai/generativelanguage`
-   **Correct:** `npm install @google/genai`

**APIs and Usage:**

-   **Incorrect:** `const { GenerativeModel } =
    require('@google/generative-ai')` -> **Correct:** `import { GoogleGenAI }
    from '@google/genai'`
-   **Incorrect:** `const model = genai.getGenerativeModel(...)` -> **Correct:**
    `const ai = new GoogleGenAI({apiKey: "..."})`
-   **Incorrect:** `await model.generateContent(...)` -> **Correct:** `await
    ai.models.generateContent(...)`
-   **Incorrect:** `await model.generateContentStream(...)` -> **Correct:**
    `await ai.models.generateContentStream(...)`
-   **Incorrect:** `const generationConfig = { ... }` -> **Correct:** Pass
    configuration directly: `config: { safetySettings: [...] }`
-   **Incorrect** `GoogleGenerativeAI`
-   **Incorrect** `google.generativeai`
-   **Incorrect** `models.create`
-   **Incorrect** `ai.models.create`
-   **Incorrect** `models.getGenerativeModel`
-   **Incorrect** `ai.models.getModel`
-   **Incorrect** `ai.models['model_name']`
-   **Incorrect** `generationConfig`
-   **Incorrect** `GoogleGenAIError` -> **Correct** `ApiError`
-   **Incorrect** `GenerateContentResult` -> **Correct**
    `GenerateContentResponse`.
-   **Incorrect** `GenerateContentRequest` -> **Correct**
    `GenerateContentParameters`

## Initialization and API Key

The `@google/genai` library requires creating a `GoogleGenAI` instance for all
API calls.

-   Always use `const ai = new GoogleGenAI({})` to create an instance.
-   Set the `GEMINI_API_KEY` environment variable, which will be picked up
    automatically in Node.js environments.

```javascript
import { GoogleGenAI } from '@google/genai';

// Best practice: implicitly use GEMINI_API_KEY env variable
const ai = new GoogleGenAI({});

// Alternative: explicit key (avoid hardcoding in production)
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

## Models

-   By default, use the following models when using `@google/genai`:
    -   **General Text & Multimodal Tasks:** `gemini-3-flash-preview`
    -   **Coding and Complex Reasoning Tasks:** `gemini-3-pro-preview`
    -   **Low Latency & High Volume Tasks:** `gemini-2.5-flash-lite`
    -   **Fast Image Generation and Editing:** `gemini-2.5-flash-image` (aka Nano Banana)
    -   **High-Quality Image Generation and Editing:** `gemini-3-pro-image-preview` (aka Nano Banana Pro)
    -   **High-Fidelity Video Generation:** `veo-3.0-generate-001` or `veo-3.1-generate-preview`
    -   **Fast Video Generation:** `veo-3.0-fast-generate-001` or `veo-3.1-fast-generate-preview`
    -   **Advanced Video Editing Tasks:** `veo-3.1-generate-preview`

-   It is also acceptable to use the following model if explicitly requested by
    the user:
    -   **Gemini 2.0 Series**: `gemini-2.0-flash`, `gemini-2.0-flash-lite`
    -   **Gemini 2.5 Series**: `gemini-2.5-flash`, `gemini-2.5-pro`

-   Do not use the following deprecated models (or their variants like
    `gemini-1.5-flash-latest`):
    -   **Prohibited:** `gemini-1.5-flash`
    -   **Prohibited:** `gemini-1.5-pro`
    -   **Prohibited:** `gemini-pro`

## Basic Inference (Text Generation)

Here's how to generate a response from a text prompt.
Calls are stateless using the `ai.models` accessor.

```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

async function run() {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'Why is the sky blue?',
  });

  console.log(response.text); // output is often markdown
}

run();
```

## Multimodal Inputs

Pass images directly as base64 strings or use the File API.

### Using Local Files (Base64)

You can use this approach to pass a variety of data types (images, audio, video,
pdf). For PDF, use `application/pdf` as `mimeType`.

```javascript
import { GoogleGenAI, Part } from '@google/genai';
import * as fs from 'fs';

const ai = new GoogleGenAI({});

// Converts local file information to a Part object.
function fileToGenerativePart(path, mimeType): Part {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

async function run() {
  const imagePart = fileToGenerativePart("path/to/image.jpg", "image/jpeg");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      imagePart,
      'Describe this image in detail.'
    ],
  });

  console.log(response.text);
}

run();
```

### File API (For Large Files)

For video files, PDF, or long audio, upload to the File API first.

```javascript
import { GoogleGenAI, createPartFromUri, createUserContent } from '@google/genai';
const ai = new GoogleGenAI({});

async function run() {
    // Upload
    const myFile = await ai.files.upload({
        file: 'video.mp4',
        config: { mimeType: 'video/mp4' },
    });

    // Generate
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
         contents: createUserContent([
          createPartFromUri(myFile.uri, myFile.mimeType),
          "What happens in this video?"
        ])
    });

    console.log(response.text);

    // You can delete files after use like this:
    await ai.files.delete({name: myFile.name});
}

run();
```

## Advanced Capabilities

### Thinking (Reasoning)

Gemini 2.5 and 3 series models support explicit "thinking" for complex logic.

#### Gemini 3

Thinking is on by default for `gemini-3-pro-preview` and `gemini-3-flash-preview`.
It can be adjusted by using the `thinkingLevel` parameter.

- **`MINIMAL`:** (Gemini 3 Flash Only) Constrains the model to use as few tokens as possible for thinking and is best used for low-complexity tasks that wouldn't benefit from extensive reasoning.
- **`LOW`**: Constrains the model to use fewer tokens for thinking and is suitable for simpler tasks where extensive reasoning is not required.
- **`MEDIUM`**: (Gemini 3 Flash only) Offers a balanced approach suitable for tasks of moderate complexity that benefit from reasoning but don't require deep, multi-step planning.
- **`HIGH`**: (Default) Maximizes reasoning depth. The model may take significantly longer to reach a first token, but the output will be more thoroughly vetted.

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: "What is AI?",
    config: {
      thinkingConfig: {
        includeThoughts: true, // If you want to see the thoughts
        // 'HIGH' is default.
        thinkingLevel: 'LOW', // Use 'LOW' for faster/cheaper reasoning
      },
    },
  });

  // Access thoughts if returned and includeThoughts is true
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.thought) {
    console.log(`Thought: ${part.text}`); // The thought content
  } else {
    console.log(`Response: ${response.text}`);
  }
}

main();
```

#### Gemini 2.5

Thinking is on by default for `gemini-2.5-pro` and `gemini-2.5-flash`. It can be
adjusted by using the `thinkingBudget` setting. Setting it to zero turns
thinking off, and will reduce latency.

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: "What is AI?",
    config: {
      thinkingConfig: {
        thinkingBudget: 0 // Turn thinking OFF
        // thinkingBudget: 1024 // Turn thinking ON with specific token budget
      },
    },
  });

  console.log(response.text);
}

main();
```

IMPORTANT NOTES:

-   Minimum thinking budget for `gemini-2.5-pro` is `128` and thinking can not
    be turned off for that model.
-   No models (apart from Gemini 2.5/3 series) support thinking or thinking
    budgets APIs. Do not try to adjust thinking budgets for other models.

### System Instructions

Use system instructions to guide the model's behavior.

```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

async function run() {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Explain quantum physics.",
        config: {
            systemInstruction: "You are a pirate",
        }
    });
    console.log(response.text);
}
run();
```

### Hyperparameters

You can also set `temperature` or `maxOutputTokens` within the `config` object.
**Avoid** setting `maxOutputTokens`, `topP`, `topK` unless explicitly requested
by the user.

### Safety configurations

Avoid setting safety configurations unless explicitly requested by the user. If
explicitly asked for by the user, here is a sample API:

```javascript
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Part } from '@google/genai';
import * as fs from 'fs';

const ai = new GoogleGenAI({});

function fileToGenerativePart(path, mimeType): Part {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

async function run() {
    const img = fileToGenerativePart("/path/to/img.jpg", "image/jpeg");
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: ['Do these look store-bought or homemade?', img],
        config: {
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
            ]
        }
    });
    console.log(response.text);
}
run();
```

### Streaming

Use `generateContentStream` to reduce time-to-first-token.

```javascript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});

async function run() {
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: ["Write a long story about a space pirate."],
  });

  for await (const chunk of responseStream) {
    process.stdout.write(chunk.text);
  }
  console.log(); // for a final newline
}
run();
```

### Chat

For multi-turn conversations, use the `chats` service to maintain conversation
history.

```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

async function run() {
    const chat = ai.chats.create({model: "gemini-3-flash-preview"});

    let response = await chat.sendMessage({message: "I have a cat named Whiskers."});
    console.log(response.text);

    response = await chat.sendMessage({message: "What is the name of my pet?"});
    console.log(response.text);

    // To access specific elements in chat history
    const history = await chat.getHistory();
    for (const message of history) {
        console.log(`role - ${message.role}: ${message.parts[0].text}`);
    }
}
run();
```

It is also possible to use streaming with Chat:

```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

async function run() {
    const chat = ai.chats.create({model: "gemini-3-flash-preview"});
    const stream = await chat.sendMessageStream({message:"I have 2 dogs in my house."});
    for await (const chunk of stream) {
      console.log(chunk.text);
      console.log("_".repeat(80));
    }
}
run();
```

Note: `ai.chats.create({model})` returns `Chat` under `@google/genai` which tracks
the session.

### Structured Outputs (JSON Schema)

Enforce a specific JSON schema using the `responseJsonSchema` configuration.

See the available types below that can be used in the `responseJsonSchema`.

```javascript
export enum Type {
  /**
   *   Not specified, should not be used.
   */
  TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
  /**
   *   OpenAPI string type
   */
  STRING = 'STRING',
  /**
   *   OpenAPI number type
   */
  NUMBER = 'NUMBER',
  /**
   *   OpenAPI integer type
   */
  INTEGER = 'INTEGER',
  /**
   *   OpenAPI boolean type
   */
  BOOLEAN = 'BOOLEAN',
  /**
   *   OpenAPI array type
   */
  ARRAY = 'ARRAY',
  /**
   *   OpenAPI object type
   */
  OBJECT = 'OBJECT',
  /**
   *   Null type
   */
  NULL = 'NULL',
}
```

`Type.OBJECT` cannot be empty; it must contain other properties.

```javascript
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "List a few popular cookie recipes, and include the amounts of ingredients.",
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              recipeName: {
                type: Type.STRING,
                description: 'The name of the recipe.',
              },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: 'The ingredients for the recipe.',
              },
            },
            propertyOrdering: ["recipeName", "ingredients"],
          },
        },
    },
  });

  // response.text is guaranteed to be valid JSON matching the schema
  console.log(response.text);
  const recipe = JSON.parse(response.text);
}

main();
```

The `response.text` might look like this:

```json
[
  {
    "recipeName": "Chocolate Chip Cookies",
    "ingredients": [
      "1 cup (2 sticks) unsalted butter, softened",
      "3/4 cup granulated sugar",
      "3/4 cup packed brown sugar",
      "1 teaspoon vanilla extract",
      "2 large eggs",
      "2 1/4 cups all-purpose flour",
      "1 teaspoon baking soda",
      "1 teaspoon salt",
      "2 cups chocolate chips"
    ]
  },
  ...
]
```

### Function Calling (Tools)

You can provide the model with tools (functions) it can use to bring in external
information to answer a question or act on a request outside the model.

```javascript
import {GoogleGenAI, FunctionDeclaration, Type} from '@google/genai';
const ai = new GoogleGenAI({});

async function run() {
    const controlLightDeclaration = {
        name: 'controlLight',
        parameters: {
          type: Type.OBJECT,
          description: 'Set brightness and color temperature of a light.',
          properties: {
            brightness: { type: Type.NUMBER, description: 'Light level from 0 to 100.' },
            colorTemperature: { type: Type.STRING, description: '`daylight`, `cool`, or `warm`.'},
          },
          required: ['brightness', 'colorTemperature'],
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Dim the lights so the room feels cozy and warm.',
        config: {
            tools: [{ functionDeclarations: [controlLightDeclaration] }]
        }
    });

    if (response.functionCalls) {
        console.log('Function calls requested by the model:');
        console.log(response.functionCalls);
        // In a real app, you would execute the function and send the result back.
    } else {
        console.log(response.text);
    }
}
run();
```

### Grounding (Google Search)

Connect the model to real-time web data.

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function run() {
    const response = await ai.models.generateContent({
       model: "gemini-3-flash-preview",
       contents: "What was the score of the latest Olympique Lyonais game?",
       config: {
         tools: [{ googleSearch: {} }],
       },
    });

    console.log(response.text);

    // Inspect grounding metadata
    const metadata = response.candidates?.[0]?.groundingMetadata;
    if (metadata) {
        console.log("Search Queries:", metadata.webSearchQueries);
        const urls = metadata.groundingChunks?.map(chunk => chunk.web?.title) || [];
        console.log("Sources:", urls);
    }
}
run();
```

## Media Generation

### Generate Images

Here's how to generate images using the Nano Banana models. Start with the
Gemini 2.5 Flash Image (Nano Banana) model as it should cover most use-cases.

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';

const ai = new GoogleGenAI({});

async function main() {
  const prompt = "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
    }
  }
}

main();
```

Upgrade to the Gemini 3 Pro image (Nano Banana Pro) model if the user requests
high-resolution images or needs real-time information using the Google Search
tool.

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';

const ai = new GoogleGenAI({});

async function main() {
  const prompt = 'Visualize the current weather forecast for the next 5 days in San Francisco as a clean, modern weather chart. Add a visual on what I should wear each day';
  const aspectRatio = '16:9'; // "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
  const resolution = '2K';  // "1K", "2K", "4K"

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution,
      },
      tools: [{ googleSearch: {} }]
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
    }
  }
}

main();
```

### Edit Images

Editing images is better done using the Gemini native image generation model,
and it is recommended to use chat mode. Configs are not supported in this model
(except modality).

```javascript
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

const ai = new GoogleGenAI({});

async function main() {
  const imageBuffer = fs.readFileSync('path/to/image.png');
  const imageBase64 = imageBuffer.toString('base64');

  // Create the chat
  const chat = ai.chats.create({ model: 'gemini-2.5-flash-image' });

  // Send the image and ask for it to be edited
  const response = await chat.sendMessage({
      content: [
          { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          "Make it a bananas foster."
      ]
  });

  // Get the generated image(s)
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
    }
  }
}

main();
```

### Video Generation (Veo)

Use the Veo models for video generation. Usage of Veo can be costly,
so after generating code for it, give user a heads up to check pricing for Veo.

```javascript
import { GoogleGenAI } from "@google/genai";
import { createWriteStream } from "fs";
import { Readable } from "stream";

const ai = new GoogleGenAI({});

async function main() {
  // Video generation is an async operation
  let operation = await ai.models.generateVideos({
    model: "veo-3.0-fast-generate-001",
    prompt: "Panning wide shot of a calico kitten sleeping in the sunshine",
    config: {
      personGeneration: "dont_allow",
      aspectRatio: "16:9",
    },
  });

  console.log("Generating video...");

  // Poll for completion
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Sleep 10s
    operation = await ai.operations.getVideosOperation({
      operation: operation,
    });
  }

  // Download results
  if (operation.response?.generatedVideos) {
    operation.response.generatedVideos.forEach(async (video, n) => {
        const videoUrl = `${video.video.uri}&key=${process.env.GEMINI_API_KEY}`;
        const resp = await fetch(videoUrl);
        const writer = createWriteStream(`video${n}.mp4`);
        Readable.fromWeb(resp.body).pipe(writer);
        console.log(`Saved video${n}.mp4`);
    });
  }
}

main();
```

### Content and Part Hierarchy

While the simpler API call is often sufficient, you may run into scenarios where
you need to work directly with the underlying `Content` and `Part` objects for
more explicit control. These are the fundamental building blocks of the
`generateContent` API.

For instance, the following simple API call:

```javascript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});

async function run() {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "How does AI work?",
    });
    console.log(response.text);
}
run();
```

is effectively a shorthand for this more explicit structure:

```javascript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});

async function run() {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            {
                role: "user",
                parts: [{ text: "How does AI work?" }]
            },
        ],
    });
    console.log(response.text);
}
run();
```

## API Errors

`ApiError` from `@google/genai` extends from EcmaScript `Error` and has
`message`, `name` fields in addition to `status` (HTTP Code).

## Other APIs

The list of APIs and capabilities above are not comprehensive. If users ask you
to generate code for a capability not provided above, refer them to
[https://googleapis.github.io/js-genai/](https://googleapis.github.io/js-genai/).

## Useful Links

-   Documentation: ai.google.dev/gemini-api/docs
-   API Keys and Authentication: ai.google.dev/gemini-api/docs/api-key
-   Models: ai.google.dev/models
-   API Pricing: ai.google.dev/pricing
-   Rate Limits: ai.google.dev/rate-limits
