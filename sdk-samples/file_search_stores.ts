/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const BLOB = new Blob(
  [
    'The Whispering Woods In the heart of Eldergrove, there stood a forest whispered about by the villagers. They spoke of trees that could talk and streams that sang. Young Elara, curious and adventurous, decided to explore the woods one crisp autumn morning. As she wandered deeper, the leaves rustled with excitement, revealing hidden paths. Elara noticed the trees bending slightly as if beckoning her to come closer. When she paused to listen, she heard soft murmurs—stories of lost treasures and forgotten dreams. Drawn by the enchanting sounds, she followed a narrow trail until she stumbled upon a shimmering pond. At its edge, a wise old willow tree spoke, “Child of the village, what do you seek?” “I seek adventure,” Elara replied, her heart racing. “Adventure lies not in faraway lands but within your spirit,” the willow said, swaying gently. “Every choice you make is a step into the unknown.” With newfound courage, Elara left the woods, her mind buzzing with possibilities. The villagers would say the woods were magical, but to Elara, it was the spark of her imagination that had transformed her ordinary world into a realm of endless adventures. She smiled, knowing her journey was just beginning',
  ],
  {type: 'text/plain'},
);

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listFileSearchStores() {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const fileSearchStores = await ai.fileSearchStores.list();
  for await (const fileSearchStore of fileSearchStores) {
    console.log('list file search store: ', fileSearchStore);
  }
}

async function getFileSearchStore(fileSearchStoreName: string) {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const fileSearchStore = await ai.fileSearchStores.get({
    name: fileSearchStoreName,
  });
  console.log('get file search store: ', fileSearchStore);
}

async function createFileSearchStore(): Promise<string> {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const fileSearchStore = await ai.fileSearchStores.create({});
  console.log('create file search store: ', fileSearchStore);
  return fileSearchStore.name!;
}

async function importFileToFileSearchStore(fileSearchStoreName: string) {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const file = await ai.files.upload({file: BLOB});
  console.log('uploaded file: ', file.name);

  let op = await ai.fileSearchStores.importFile({
    fileSearchStoreName,
    fileName: file.name!,
    config: {
      customMetadata: [{key: 'author', stringValue: 'foo'}],
    },
  });
  while (!op.done) {
    await delay(5000);
    op = await ai.operations.get({operation: op});
    console.log('operation: ', op);
  }
}

async function uploadBlobToFileSearchStore(fileSearchStoreName: string) {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  let op = await ai.fileSearchStores.uploadToFileSearchStore({
    fileSearchStoreName,
    file: BLOB,
    config: {
      customMetadata: [{key: 'author', stringValue: 'foo'}],
      displayName: 'a blob name',
    },
  });
  while (!op.done) {
    await delay(5000);
    op = await ai.operations.get({operation: op});
    console.log('operation: ', op);
  }
}

async function fileSearch(fileSearchStoreName: string) {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: "What is the character's name in the story?",
    config: {
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: [fileSearchStoreName],
            metadataFilter: 'author=foo',
          },
        },
      ],
    },
  });
  console.log('text response: ', response.text);
  console.log(
    'grounding metadata: ',
    JSON.stringify(response.candidates?.[0]?.groundingMetadata, null, 2),
  );
}

async function deleteFileSearchStore(fileSearchStoreName: string) {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  await ai.fileSearchStores.delete({
    name: fileSearchStoreName,
    config: {force: true},
  });
}

async function listDocuments(fileSearchStoreName: string): Promise<string[]> {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const documents = await ai.fileSearchStores.documents.list({
    parent: fileSearchStoreName,
  });
  const documentNames: string[] = [];
  for await (const document of documents) {
    console.log('list documents: ', document);
    if (document.name) {
      documentNames.push(document.name);
    }
  }
  return documentNames;
}

async function getDocument(name: string) {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const document = await ai.fileSearchStores.documents.get({
    name,
  });
  console.log('get document: ', document);
}

async function deleteDocument(name: string) {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  await ai.fileSearchStores.documents.delete({
    name,
    config: {force: true},
  });
}

async function main() {
  try {
    const fileSearchStoreName = await createFileSearchStore();
    await listFileSearchStores();
    await getFileSearchStore(fileSearchStoreName);
    await importFileToFileSearchStore(fileSearchStoreName);
    await uploadBlobToFileSearchStore(fileSearchStoreName);
    await fileSearch(fileSearchStoreName);
    const documentNames = await listDocuments(fileSearchStoreName);
    await getDocument(documentNames[0]);
    await deleteDocument(documentNames[0]);
    await deleteFileSearchStore(fileSearchStoreName);
  } catch (e) {
    console.error('got error', e);
  }
}

main();
