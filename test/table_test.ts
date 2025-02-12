/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Client} from '../src/node/client';
import {ReplayAPIClient} from '../src/_replay_api_client';
import {FakeAuth} from '../src/_fake_auth';
import * as types from '../src/types';

function getGoogle3Path() {
  if (process.env['UNITTEST_ON_FORGE']) {
    return process.cwd();
  }
  const currentDir = process.cwd();
  const lastIndex = currentDir.lastIndexOf('google3/');
  if (lastIndex === -1) {
    return '';
  }
  return currentDir.substring(0, lastIndex + 'google3/'.length);
}

function websafeEncode(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_');
}

function isBase64Encoded(str: string): boolean {
  try {
    const decoded = atob(str);
    return btoa(decoded) === str;
  } catch (err) {
    return false;
  }
}

function isObjectEmpty(obj: any) {
  if (obj === undefined) {
    return true;
  }
  if (typeof obj !== 'object') {
    return false;
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object') {
      if (!isObjectEmpty(obj[key])) {
        return false;
      }
    } else if (obj[key] !== undefined) {
      return false;
    }
  }
  return true;
}

function assertMessagesEqual(
  actual: any,
  expected: any,
  options?: {ignoreKeys?: string[]},
) {
  const {ignoreKeys = []} = options || {};

  function assertDeepEqual(a: any, b: any) {
    if (typeof a !== typeof b) {
      // Possible that the type is bytes, which is represented in NodeJS as a
      // string.
      if (typeof a === 'string' && typeof b === 'number') {
        if (a !== b.toString()) {
          throw new Error(
            `Unequal string and number values:\n a: ${a}\n b: ${b}`,
          );
        }
        return;
      } else if (a === undefined && typeof b === 'object') {
        if (!isObjectEmpty(b)) {
          throw new Error(`Object should be empty:\n a: ${a}\n b: ${b}`);
        }
        return;
      } else {
        throw new Error(`Invalid type: ${typeof a} !== ${typeof b}`);
      }
    }

    if (typeof a === 'object') {
      const aKeys = Object.keys(a).filter((key) => !ignoreKeys.includes(key));
      const bKeys = Object.keys(b).filter((key) => !ignoreKeys.includes(key));

      if (aKeys.length !== bKeys.length) {
        throw new Error(`Unequal keys: ${aKeys} !== ${bKeys}`);
      }

      for (const key of aKeys) {
        if (key === 'usageMetadata') {
          continue;
        }
        try {
          assertDeepEqual(a[key], b[key]);
        } catch (e) {
          let message = (e as Error).message;
          if (
            !message.includes('Unequal key value') &&
            !message.includes('Unequal key trace')
          ) {
            message = `Unequal key value:\n a[${key}]: ${JSON.stringify(
              a[key],
              null,
              2,
            )}\n b[${key}]: ${JSON.stringify(b[key], null, 2)}`;
          } else {
            message = `Unequal key trace (see cause for detals): ${key}`;
          }

          throw new Error(message, {cause: e});
        }
      }

      return;
    }

    if (typeof a === 'string' && isBase64Encoded(a)) {
      const aEncoded = snakeToCamel(websafeEncode(a));
      const bEncoded = snakeToCamel(websafeEncode(b));
      if (aEncoded !== bEncoded) {
        throw new Error(
          `Unequal base64 encoded strings:\n a: ${aEncoded}\n b: ${bEncoded}`,
        );
      }
      return;
    }

    if (Date.parse(a)) {
      if (Date.parse(a) !== Date.parse(b)) {
        throw new Error(`Unequal dates:\n a: ${a}\n b: ${b}`);
      }
      return;
    }

    if (a !== b) {
      throw new Error(`Unequal values:\n a: ${a}\n b: ${b}`);
    }
  }

  assertDeepEqual(actual, expected);
}

function redactVersionNumber(versionNumber: string) {
  return versionNumber.replace(/v*\d+\.\d+\.\d+/g, '{VERSION_NUMBER}');
}

function redactLanguageLabel(languageLabel: string) {
  return languageLabel.replace(/gl-node/g, '{LANGUAGE_LABEL}');
}

function redactHeader(headerKey: string, headerValue: string) {
  if (headerKey.toLowerCase() === 'x-goog-api-key') {
    return '{REDACTED}';
  } else if (headerKey.toLowerCase() === 'user-agent') {
    return redactLanguageLabel(redactVersionNumber(headerValue));
  } else if (headerKey.toLowerCase() === 'x-goog-api-client') {
    return redactLanguageLabel(redactVersionNumber(headerValue));
  } else {
    return headerValue;
  }
}

function redactUrl(url: string) {
  // Redact all the url parts before the resource name, so the test can work
  // against any project, location, version, or whether it's EasyGCP.
  url = url.replace(
    /.*\/projects\/[^/]+\/locations\/[^/]+\//,
    '{VERTEX_URL_PREFIX}/',
  );
  url = url.replace(
    /.*-aiplatform.googleapis.com\/[^/]+\//,
    '{VERTEX_URL_PREFIX}/',
  );
  url = url.replace(
    /https:\/\/generativelanguage.googleapis.com\/[^/]+/,
    '{MLDEV_URL_PREFIX}',
  );
  return url;
}

function normalizeKey(key: string) {
  if (key === 'content-type') {
    return 'Content-Type';
  } else if (key === 'authorization') {
    return null;
  } else {
    return key;
  }
}

function normalizeHeaders(headers?: Headers, ignoreAuthorizationHeader = true) {
  let headersObject: {[key: string]: string} = {};
  if (headers) {
    for (const [key, value] of headers.entries()) {
      const normalizedKey = normalizeKey(key);
      if (normalizedKey === null) {
        continue;
      }
      headersObject[normalizedKey] = redactHeader(normalizedKey, value);
    }
  }
  return headersObject;
}

function redactProjectAndLocationPath(path: string) {
  return path.replace(
    /projects\/[^/]+\/locations\/[^/]+\//,
    '{PROJECT_AND_LOCATION_PATH}/',
  );
}

function normalizeBody(body: string) {
  try {
    if (body === undefined) {
      return body;
    }
    let camelCaseBody = snakeToCamel(body);
    let parsedBody = JSON.parse(camelCaseBody);
    if (typeof parsedBody === 'object' && parsedBody !== null) {
      for (const key of Object.keys(parsedBody as object)) {
        let value = (parsedBody as any)[key];
        if (typeof value === 'string') {
          (parsedBody as any)[key] = redactProjectAndLocationPath(value);
        }
      }
      parsedBody = [parsedBody];
    }
    return parsedBody;
  } catch (e) {
    throw new Error(`Failed to parse body: ${body}`, {cause: e});
  }
}

function normalizeRequest(request: RequestInit, url: string) {
  return {
    method: request.method?.toLowerCase(),
    url: redactUrl(url),
    headers: normalizeHeaders(request.headers as Headers),
    bodySegments: normalizeBody(request.body as string),
  };
}

import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert/strict';

/**
 * Gets the test mode from the environment variable. Currently supports 'api'
 * and 'replay' mode and defaults to replay.
 */
function getTestMode() {
  const mode = process.env['GOOGLE_GENAI_CLIENT_MODE'];
  if (mode === 'api') {
    return 'api';
  } else {
    return 'replay';
  }
}

function walk(dir: string): string[] {
  let files = fs.readdirSync(dir);
  let mapped_files: (string[]|string)[] = files.map((file: string) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory())
      return walk(filePath);
    else if (stats.isFile())
      return filePath;
    else {
      throw new Error(
          `We should never reach here.`,
      );
    }
  });

  return mapped_files.reduce(
             (all: string[], folderContents: string[]|string) =>
                 all.concat(folderContents),
             [],
             ) as string[];
}

function normalizeParameters(parameters: any): any {
  return JSON.parse(
      snakeToCamel(
          JSON.stringify(parameters),
          ),
  );
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Creates a new ReplayAPIClient. If the tests are running in replay mode, the
 * client will be configured to use the mock server.
 */
function createReplayClient(vertexai: boolean) {
  let apiKey = process.env['GOOGLE_API_KEY'];
  if (apiKey === undefined || apiKey === null || apiKey === '') {
    apiKey = 'This is not the key you are looking for';
  }
  const replayClient = new ReplayAPIClient({
    // Currently the vertex tests are assuming no API key set, however with
    // Google Cloud Express that assumption is no longer true.
    // TODO: When the code supports Google Cloud Express we should not
    // decide whether to set an apiKey based is the vertexai param.
    auth: new FakeAuth(vertexai? undefined : apiKey),
    vertexai: vertexai,
    apiKey: apiKey,
  });
  return replayClient;
}

function getTestTableMethod(
  client: Client,
  moduleName: string,
  methodName: string,
): Function | null {
  const module: object = (client as any)[moduleName];

  if (!module) {
    console.log(
      `    === Skipping method: ${moduleName}.${methodName}, Module "${
        moduleName
      }" is not supported in TypeScript`,
    );
    return null;
  }
  const method: Function = (module as any)[methodName];
  if (!method) {
    console.log(
      `   === Skipping method:${moduleName}.${
        methodName
      }, not supported in TypeScript`,
    );
    return null;
  }
  return method;
}

function shouldSkipTestTableItem(
  testTableItem: types.TestTableItem,
  testName: string,
  client: ReplayAPIClient,
  mode: string,
): boolean {
  if (testTableItem.exceptionIfMldev && !client.vertexai) {
    // TODO: ybo handle exception.
    console.log(
      `   === Skipping item: ${testName} because it should fail in MLDev`,
    );
    return true;
  }
  if (testTableItem.exceptionIfVertex && client.vertexai) {
    // TODO: ybo handle exception.
    console.log(
      `   === Skipping item: ${testName} because it should fail in VertexAI`,
    );
    return true;
  }
  if (mode === 'api' && testTableItem.skipInApiMode) {
    console.log(
      `   === Skipping item: ${
        testName
      } because it is not repeatable in API mode`,
    );
    return true;
  }
  return false;
}

function loadTestFiles(): string[] {
  const google3Path = getGoogle3Path();
  const replayPath =
    google3Path + '/google/cloud/aiplatform/sdk/genai/replays/tests';

  const testFiles: string[] = [];
  const files = walk(replayPath);

  files
    .filter((file: string) => file.endsWith('/_test_table.json'))
    .forEach((file: string) => {
      testFiles.push(file);
    });

  return testFiles;
}

interface TestInfo {
  fullTestName: string;
  testTableItem: types.TestTableItem;
  client: ReplayAPIClient;
  method: Function;
  testFileName: string;
}

function loadTestTableForMode(
  testFileName: string,
  client: ReplayAPIClient,
  testTableFile: types.TestTableFile,
  mode: string,
) {
  const parts = testTableFile.testMethod!.split('.');
  const moduleName: string = snakeToCamel(parts[0]);
  let methodName: string = snakeToCamel(parts[1]);
  // Test the _list method since the replay files expect the list response
  // instead of the Pager wrapper.
  if (methodName === 'list') {
    methodName = '_list';
  }
  const method = getTestTableMethod(client, moduleName, methodName);

  if (!method) {
    return;
  }

  for (const testTableItem of testTableFile.testTable!) {
    const testName = `${moduleName}.${methodName}.${testTableItem.name}.${
      client.vertexai ? 'vertex' : 'mldev'
    }`;

    if (!shouldSkipTestTableItem(testTableItem, testName, client, mode)) {
      if (mode === 'replay') {
        replayTests.push({
          fullTestName: testName,
          testTableItem,
          client,
          method,
          testFileName: testFileName,
        });
      } else if (mode === 'api') {
        apiTests.push({
          fullTestName: testName,
          testTableItem,
          client,
          method,
          testFileName: testFileName,
        });
      }
    }
  }
}

const replayTests: TestInfo[] = [];
const apiTests: TestInfo[] = [];

function loadTests() {
  const testFiles = loadTestFiles();
  const mode = getTestMode();
  for (const testFileName of testFiles) {
    const data = fs.readFileSync(testFileName, 'utf8');
    const testTableFile = JSON.parse(data) as types.TestTableFile;
    const mldevClient = createReplayClient(/*vertexai=*/ false);
    const vertexClient = createReplayClient(/*vertexai=*/ true);
    loadTestTableForMode(testFileName, mldevClient, testTableFile, mode);
    loadTestTableForMode(testFileName, vertexClient, testTableFile, mode);
  }
}

describe('TableTest', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000; // 30 seconds

  // Due to the way Jasmine works, we need to load the tests synchronously
  // before the tests are even defined.
  loadTests();

  for (const replayTest of replayTests) {
    it(replayTest.fullTestName, async () => {
      const parameters = normalizeParameters(replayTest.testTableItem.parameters!);
      replayTest.client.loadReplayFilename(
        replayTest.testFileName,
        replayTest.testTableItem,
        `${replayTest.testTableItem.name}.${
          replayTest.client.vertexai ? 'vertex' : 'mldev'
        }`,
      );
      const fetchSpy: jasmine.Spy = spyOn(global, 'fetch');

      replayTest.client.setupReplayResponses(fetchSpy);
      const numInteractions = replayTest.client.getNumInteractions();
      const response = await replayTest.method.apply(
          replayTest.client,
          [parameters],
      );

      for (let i = 0; i < numInteractions; i++) {
        const expectedRequest =
          replayTest.client.getExpectedRequestFromReplayFile(i);
        const expectedRequestCamelCase = JSON.parse(
          snakeToCamel(JSON.stringify(expectedRequest)),
        );
        const requestArgs = fetchSpy.calls.argsFor(i);
        const request = requestArgs[1];
        const url = requestArgs[0];
        console.log(
          `=== asserting request for replay test: ${replayTest.fullTestName}`,
        );
        assertMessagesEqual(
            normalizeRequest(request, url),
            expectedRequestCamelCase,
        );
      }
      // Get the last response from the replay file, which will be the response
      // from the test method. We only test the last response because it's the
      // only one that we get after the SDK has processed it. We could add a spy
      // to the request method to get each response after it's processed if we
      // want to test all of them.
      const expectedResponse =
        replayTest.client.getExpectedResponseFromReplayFile(
          numInteractions - 1,
        );
      const responseCamelCase = JSON.parse(
          snakeToCamel(JSON.stringify(response)),
      );
      const expectedResponseCamelCase = JSON.parse(
        snakeToCamel(JSON.stringify(expectedResponse)),
      );

      console.log(
        `=== asserting response for replay test: ${replayTest.fullTestName}`,
      );
      assertMessagesEqual(responseCamelCase, expectedResponseCamelCase);
    });
  }

  for (const apiTest of apiTests) {
    it(apiTest.fullTestName, async () => {
      const parameters = normalizeParameters(apiTest.testTableItem.parameters!);
      console.log(
        `=== calling api for test: ${apiTest.fullTestName}`,
      );
      await apiTest.method.apply(apiTest.client, [parameters]);
    });
  }
});
