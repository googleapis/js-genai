/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {ContentListUnion, createPartFromUri, GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromFileUploadMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
  const testFile = new Blob(
    [
      'The Whispering Woods In the heart of Eldergrove, there stood a forest whispered about by the villagers. They spoke of trees that could talk and streams that sang. Young Elara, curious and adventurous, decided to explore the woods one crisp autumn morning. As she wandered deeper, the leaves rustled with excitement, revealing hidden paths. Elara noticed the trees bending slightly as if beckoning her to come closer. When she paused to listen, she heard soft murmurs—stories of lost treasures and forgotten dreams. Drawn by the enchanting sounds, she followed a narrow trail until she stumbled upon a shimmering pond. At its edge, a wise old willow tree spoke, “Child of the village, what do you seek?” “I seek adventure,” Elara replied, her heart racing. “Adventure lies not in faraway lands but within your spirit,” the willow said, swaying gently. “Every choice you make is a step into the unknown.” With newfound courage, Elara left the woods, her mind buzzing with possibilities. The villagers would say the woods were magical, but to Elara, it was the spark of her imagination that had transformed her ordinary world into a realm of endless adventures. She smiled, knowing her journey was just beginning',
    ],
    {type: 'text/plain'},
  );

  // Upload the file.
  const file = await ai.files.upload({
    file: testFile,
    config: {
      displayName: 'generate_file.txt',
    },
  });

  // Wait for the file to be processed.
  let getFile = await ai.files.get({name: file.name as string});
  while (getFile.state === 'PROCESSING') {
    getFile = await ai.files.get({name: file.name as string});
    console.log(`current file status: ${getFile.state}`);
    console.log('File is still processing, retrying in 5 seconds');

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  }
  if (file.state === 'FAILED') {
    throw new Error('File processing failed.');
  }

  // Add the file to the contents.
  const content: ContentListUnion = [
    'Summarize the story in a single sentence.',
  ];

  if (file.uri && file.mimeType) {
    const fileContent = createPartFromUri(file.uri, file.mimeType);
    content.push(fileContent);
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: content,
  });

  console.debug(response.text);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log('Vertex AI is not supported for this sample.');
    return;
  } else {
    await generateContentFromFileUploadMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
