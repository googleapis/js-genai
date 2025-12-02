/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as common from '../_common.js';
import * as t from '../_transformers.js';
export function blobToMldev(fromObject) {
    const toObject = {};
    const fromData = common.getValueByPath(fromObject, ['data']);
    if (fromData != null) {
        common.setValueByPath(toObject, ['data'], fromData);
    }
    if (common.getValueByPath(fromObject, ['displayName']) !== undefined) {
        throw new Error('displayName parameter is not supported in Gemini API.');
    }
    const fromMimeType = common.getValueByPath(fromObject, ['mimeType']);
    if (fromMimeType != null) {
        common.setValueByPath(toObject, ['mimeType'], fromMimeType);
    }
    return toObject;
}
export function contentToMldev(fromObject) {
    const toObject = {};
    const fromParts = common.getValueByPath(fromObject, ['parts']);
    if (fromParts != null) {
        let transformedList = fromParts;
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return partToMldev(item);
            });
        }
        common.setValueByPath(toObject, ['parts'], transformedList);
    }
    const fromRole = common.getValueByPath(fromObject, ['role']);
    if (fromRole != null) {
        common.setValueByPath(toObject, ['role'], fromRole);
    }
    return toObject;
}
export function createCachedContentConfigToMldev(fromObject, parentObject) {
    const toObject = {};
    const fromTtl = common.getValueByPath(fromObject, ['ttl']);
    if (parentObject !== undefined && fromTtl != null) {
        common.setValueByPath(parentObject, ['ttl'], fromTtl);
    }
    const fromExpireTime = common.getValueByPath(fromObject, ['expireTime']);
    if (parentObject !== undefined && fromExpireTime != null) {
        common.setValueByPath(parentObject, ['expireTime'], fromExpireTime);
    }
    const fromDisplayName = common.getValueByPath(fromObject, ['displayName']);
    if (parentObject !== undefined && fromDisplayName != null) {
        common.setValueByPath(parentObject, ['displayName'], fromDisplayName);
    }
    const fromContents = common.getValueByPath(fromObject, ['contents']);
    if (parentObject !== undefined && fromContents != null) {
        let transformedList = t.tContents(fromContents);
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return contentToMldev(item);
            });
        }
        common.setValueByPath(parentObject, ['contents'], transformedList);
    }
    const fromSystemInstruction = common.getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (parentObject !== undefined && fromSystemInstruction != null) {
        common.setValueByPath(parentObject, ['systemInstruction'], contentToMldev(t.tContent(fromSystemInstruction)));
    }
    const fromTools = common.getValueByPath(fromObject, ['tools']);
    if (parentObject !== undefined && fromTools != null) {
        let transformedList = fromTools;
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return toolToMldev(item);
            });
        }
        common.setValueByPath(parentObject, ['tools'], transformedList);
    }
    const fromToolConfig = common.getValueByPath(fromObject, ['toolConfig']);
    if (parentObject !== undefined && fromToolConfig != null) {
        common.setValueByPath(parentObject, ['toolConfig'], toolConfigToMldev(fromToolConfig));
    }
    if (common.getValueByPath(fromObject, ['kmsKeyName']) !== undefined) {
        throw new Error('kmsKeyName parameter is not supported in Gemini API.');
    }
    return toObject;
}
export function createCachedContentConfigToVertex(fromObject, parentObject) {
    const toObject = {};
    const fromTtl = common.getValueByPath(fromObject, ['ttl']);
    if (parentObject !== undefined && fromTtl != null) {
        common.setValueByPath(parentObject, ['ttl'], fromTtl);
    }
    const fromExpireTime = common.getValueByPath(fromObject, ['expireTime']);
    if (parentObject !== undefined && fromExpireTime != null) {
        common.setValueByPath(parentObject, ['expireTime'], fromExpireTime);
    }
    const fromDisplayName = common.getValueByPath(fromObject, ['displayName']);
    if (parentObject !== undefined && fromDisplayName != null) {
        common.setValueByPath(parentObject, ['displayName'], fromDisplayName);
    }
    const fromContents = common.getValueByPath(fromObject, ['contents']);
    if (parentObject !== undefined && fromContents != null) {
        let transformedList = t.tContents(fromContents);
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return item;
            });
        }
        common.setValueByPath(parentObject, ['contents'], transformedList);
    }
    const fromSystemInstruction = common.getValueByPath(fromObject, [
        'systemInstruction',
    ]);
    if (parentObject !== undefined && fromSystemInstruction != null) {
        common.setValueByPath(parentObject, ['systemInstruction'], t.tContent(fromSystemInstruction));
    }
    const fromTools = common.getValueByPath(fromObject, ['tools']);
    if (parentObject !== undefined && fromTools != null) {
        let transformedList = fromTools;
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return toolToVertex(item);
            });
        }
        common.setValueByPath(parentObject, ['tools'], transformedList);
    }
    const fromToolConfig = common.getValueByPath(fromObject, ['toolConfig']);
    if (parentObject !== undefined && fromToolConfig != null) {
        common.setValueByPath(parentObject, ['toolConfig'], fromToolConfig);
    }
    const fromKmsKeyName = common.getValueByPath(fromObject, ['kmsKeyName']);
    if (parentObject !== undefined && fromKmsKeyName != null) {
        common.setValueByPath(parentObject, ['encryption_spec', 'kmsKeyName'], fromKmsKeyName);
    }
    return toObject;
}
export function createCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = common.getValueByPath(fromObject, ['model']);
    if (fromModel != null) {
        common.setValueByPath(toObject, ['model'], t.tCachesModel(apiClient, fromModel));
    }
    const fromConfig = common.getValueByPath(fromObject, ['config']);
    if (fromConfig != null) {
        createCachedContentConfigToMldev(fromConfig, toObject);
    }
    return toObject;
}
export function createCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = common.getValueByPath(fromObject, ['model']);
    if (fromModel != null) {
        common.setValueByPath(toObject, ['model'], t.tCachesModel(apiClient, fromModel));
    }
    const fromConfig = common.getValueByPath(fromObject, ['config']);
    if (fromConfig != null) {
        createCachedContentConfigToVertex(fromConfig, toObject);
    }
    return toObject;
}
export function deleteCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = common.getValueByPath(fromObject, ['name']);
    if (fromName != null) {
        common.setValueByPath(toObject, ['_url', 'name'], t.tCachedContentName(apiClient, fromName));
    }
    return toObject;
}
export function deleteCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = common.getValueByPath(fromObject, ['name']);
    if (fromName != null) {
        common.setValueByPath(toObject, ['_url', 'name'], t.tCachedContentName(apiClient, fromName));
    }
    return toObject;
}
export function deleteCachedContentResponseFromMldev(fromObject) {
    const toObject = {};
    const fromSdkHttpResponse = common.getValueByPath(fromObject, [
        'sdkHttpResponse',
    ]);
    if (fromSdkHttpResponse != null) {
        common.setValueByPath(toObject, ['sdkHttpResponse'], fromSdkHttpResponse);
    }
    return toObject;
}
export function deleteCachedContentResponseFromVertex(fromObject) {
    const toObject = {};
    const fromSdkHttpResponse = common.getValueByPath(fromObject, [
        'sdkHttpResponse',
    ]);
    if (fromSdkHttpResponse != null) {
        common.setValueByPath(toObject, ['sdkHttpResponse'], fromSdkHttpResponse);
    }
    return toObject;
}
export function fileDataToMldev(fromObject) {
    const toObject = {};
    if (common.getValueByPath(fromObject, ['displayName']) !== undefined) {
        throw new Error('displayName parameter is not supported in Gemini API.');
    }
    const fromFileUri = common.getValueByPath(fromObject, ['fileUri']);
    if (fromFileUri != null) {
        common.setValueByPath(toObject, ['fileUri'], fromFileUri);
    }
    const fromMimeType = common.getValueByPath(fromObject, ['mimeType']);
    if (fromMimeType != null) {
        common.setValueByPath(toObject, ['mimeType'], fromMimeType);
    }
    return toObject;
}
export function functionCallToMldev(fromObject) {
    const toObject = {};
    const fromId = common.getValueByPath(fromObject, ['id']);
    if (fromId != null) {
        common.setValueByPath(toObject, ['id'], fromId);
    }
    const fromArgs = common.getValueByPath(fromObject, ['args']);
    if (fromArgs != null) {
        common.setValueByPath(toObject, ['args'], fromArgs);
    }
    const fromName = common.getValueByPath(fromObject, ['name']);
    if (fromName != null) {
        common.setValueByPath(toObject, ['name'], fromName);
    }
    if (common.getValueByPath(fromObject, ['partialArgs']) !== undefined) {
        throw new Error('partialArgs parameter is not supported in Gemini API.');
    }
    if (common.getValueByPath(fromObject, ['willContinue']) !== undefined) {
        throw new Error('willContinue parameter is not supported in Gemini API.');
    }
    return toObject;
}
export function functionCallingConfigToMldev(fromObject) {
    const toObject = {};
    const fromMode = common.getValueByPath(fromObject, ['mode']);
    if (fromMode != null) {
        common.setValueByPath(toObject, ['mode'], fromMode);
    }
    const fromAllowedFunctionNames = common.getValueByPath(fromObject, [
        'allowedFunctionNames',
    ]);
    if (fromAllowedFunctionNames != null) {
        common.setValueByPath(toObject, ['allowedFunctionNames'], fromAllowedFunctionNames);
    }
    if (common.getValueByPath(fromObject, ['streamFunctionCallArguments']) !==
        undefined) {
        throw new Error('streamFunctionCallArguments parameter is not supported in Gemini API.');
    }
    return toObject;
}
export function functionDeclarationToVertex(fromObject) {
    const toObject = {};
    if (common.getValueByPath(fromObject, ['behavior']) !== undefined) {
        throw new Error('behavior parameter is not supported in Vertex AI.');
    }
    const fromDescription = common.getValueByPath(fromObject, ['description']);
    if (fromDescription != null) {
        common.setValueByPath(toObject, ['description'], fromDescription);
    }
    const fromName = common.getValueByPath(fromObject, ['name']);
    if (fromName != null) {
        common.setValueByPath(toObject, ['name'], fromName);
    }
    const fromParameters = common.getValueByPath(fromObject, ['parameters']);
    if (fromParameters != null) {
        common.setValueByPath(toObject, ['parameters'], fromParameters);
    }
    const fromParametersJsonSchema = common.getValueByPath(fromObject, [
        'parametersJsonSchema',
    ]);
    if (fromParametersJsonSchema != null) {
        common.setValueByPath(toObject, ['parametersJsonSchema'], fromParametersJsonSchema);
    }
    const fromResponse = common.getValueByPath(fromObject, ['response']);
    if (fromResponse != null) {
        common.setValueByPath(toObject, ['response'], fromResponse);
    }
    const fromResponseJsonSchema = common.getValueByPath(fromObject, [
        'responseJsonSchema',
    ]);
    if (fromResponseJsonSchema != null) {
        common.setValueByPath(toObject, ['responseJsonSchema'], fromResponseJsonSchema);
    }
    return toObject;
}
export function getCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = common.getValueByPath(fromObject, ['name']);
    if (fromName != null) {
        common.setValueByPath(toObject, ['_url', 'name'], t.tCachedContentName(apiClient, fromName));
    }
    return toObject;
}
export function getCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = common.getValueByPath(fromObject, ['name']);
    if (fromName != null) {
        common.setValueByPath(toObject, ['_url', 'name'], t.tCachedContentName(apiClient, fromName));
    }
    return toObject;
}
export function googleMapsToMldev(fromObject) {
    const toObject = {};
    if (common.getValueByPath(fromObject, ['authConfig']) !== undefined) {
        throw new Error('authConfig parameter is not supported in Gemini API.');
    }
    const fromEnableWidget = common.getValueByPath(fromObject, ['enableWidget']);
    if (fromEnableWidget != null) {
        common.setValueByPath(toObject, ['enableWidget'], fromEnableWidget);
    }
    return toObject;
}
export function googleSearchToMldev(fromObject) {
    const toObject = {};
    if (common.getValueByPath(fromObject, ['excludeDomains']) !== undefined) {
        throw new Error('excludeDomains parameter is not supported in Gemini API.');
    }
    if (common.getValueByPath(fromObject, ['blockingConfidence']) !== undefined) {
        throw new Error('blockingConfidence parameter is not supported in Gemini API.');
    }
    const fromTimeRangeFilter = common.getValueByPath(fromObject, [
        'timeRangeFilter',
    ]);
    if (fromTimeRangeFilter != null) {
        common.setValueByPath(toObject, ['timeRangeFilter'], fromTimeRangeFilter);
    }
    return toObject;
}
export function listCachedContentsConfigToMldev(fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = common.getValueByPath(fromObject, ['pageSize']);
    if (parentObject !== undefined && fromPageSize != null) {
        common.setValueByPath(parentObject, ['_query', 'pageSize'], fromPageSize);
    }
    const fromPageToken = common.getValueByPath(fromObject, ['pageToken']);
    if (parentObject !== undefined && fromPageToken != null) {
        common.setValueByPath(parentObject, ['_query', 'pageToken'], fromPageToken);
    }
    return toObject;
}
export function listCachedContentsConfigToVertex(fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = common.getValueByPath(fromObject, ['pageSize']);
    if (parentObject !== undefined && fromPageSize != null) {
        common.setValueByPath(parentObject, ['_query', 'pageSize'], fromPageSize);
    }
    const fromPageToken = common.getValueByPath(fromObject, ['pageToken']);
    if (parentObject !== undefined && fromPageToken != null) {
        common.setValueByPath(parentObject, ['_query', 'pageToken'], fromPageToken);
    }
    return toObject;
}
export function listCachedContentsParametersToMldev(fromObject) {
    const toObject = {};
    const fromConfig = common.getValueByPath(fromObject, ['config']);
    if (fromConfig != null) {
        listCachedContentsConfigToMldev(fromConfig, toObject);
    }
    return toObject;
}
export function listCachedContentsParametersToVertex(fromObject) {
    const toObject = {};
    const fromConfig = common.getValueByPath(fromObject, ['config']);
    if (fromConfig != null) {
        listCachedContentsConfigToVertex(fromConfig, toObject);
    }
    return toObject;
}
export function listCachedContentsResponseFromMldev(fromObject) {
    const toObject = {};
    const fromSdkHttpResponse = common.getValueByPath(fromObject, [
        'sdkHttpResponse',
    ]);
    if (fromSdkHttpResponse != null) {
        common.setValueByPath(toObject, ['sdkHttpResponse'], fromSdkHttpResponse);
    }
    const fromNextPageToken = common.getValueByPath(fromObject, [
        'nextPageToken',
    ]);
    if (fromNextPageToken != null) {
        common.setValueByPath(toObject, ['nextPageToken'], fromNextPageToken);
    }
    const fromCachedContents = common.getValueByPath(fromObject, [
        'cachedContents',
    ]);
    if (fromCachedContents != null) {
        let transformedList = fromCachedContents;
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return item;
            });
        }
        common.setValueByPath(toObject, ['cachedContents'], transformedList);
    }
    return toObject;
}
export function listCachedContentsResponseFromVertex(fromObject) {
    const toObject = {};
    const fromSdkHttpResponse = common.getValueByPath(fromObject, [
        'sdkHttpResponse',
    ]);
    if (fromSdkHttpResponse != null) {
        common.setValueByPath(toObject, ['sdkHttpResponse'], fromSdkHttpResponse);
    }
    const fromNextPageToken = common.getValueByPath(fromObject, [
        'nextPageToken',
    ]);
    if (fromNextPageToken != null) {
        common.setValueByPath(toObject, ['nextPageToken'], fromNextPageToken);
    }
    const fromCachedContents = common.getValueByPath(fromObject, [
        'cachedContents',
    ]);
    if (fromCachedContents != null) {
        let transformedList = fromCachedContents;
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return item;
            });
        }
        common.setValueByPath(toObject, ['cachedContents'], transformedList);
    }
    return toObject;
}
export function partToMldev(fromObject) {
    const toObject = {};
    const fromMediaResolution = common.getValueByPath(fromObject, [
        'mediaResolution',
    ]);
    if (fromMediaResolution != null) {
        common.setValueByPath(toObject, ['mediaResolution'], fromMediaResolution);
    }
    const fromCodeExecutionResult = common.getValueByPath(fromObject, [
        'codeExecutionResult',
    ]);
    if (fromCodeExecutionResult != null) {
        common.setValueByPath(toObject, ['codeExecutionResult'], fromCodeExecutionResult);
    }
    const fromExecutableCode = common.getValueByPath(fromObject, [
        'executableCode',
    ]);
    if (fromExecutableCode != null) {
        common.setValueByPath(toObject, ['executableCode'], fromExecutableCode);
    }
    const fromFileData = common.getValueByPath(fromObject, ['fileData']);
    if (fromFileData != null) {
        common.setValueByPath(toObject, ['fileData'], fileDataToMldev(fromFileData));
    }
    const fromFunctionCall = common.getValueByPath(fromObject, ['functionCall']);
    if (fromFunctionCall != null) {
        common.setValueByPath(toObject, ['functionCall'], functionCallToMldev(fromFunctionCall));
    }
    const fromFunctionResponse = common.getValueByPath(fromObject, [
        'functionResponse',
    ]);
    if (fromFunctionResponse != null) {
        common.setValueByPath(toObject, ['functionResponse'], fromFunctionResponse);
    }
    const fromInlineData = common.getValueByPath(fromObject, ['inlineData']);
    if (fromInlineData != null) {
        common.setValueByPath(toObject, ['inlineData'], blobToMldev(fromInlineData));
    }
    const fromText = common.getValueByPath(fromObject, ['text']);
    if (fromText != null) {
        common.setValueByPath(toObject, ['text'], fromText);
    }
    const fromThought = common.getValueByPath(fromObject, ['thought']);
    if (fromThought != null) {
        common.setValueByPath(toObject, ['thought'], fromThought);
    }
    const fromThoughtSignature = common.getValueByPath(fromObject, [
        'thoughtSignature',
    ]);
    if (fromThoughtSignature != null) {
        common.setValueByPath(toObject, ['thoughtSignature'], fromThoughtSignature);
    }
    const fromVideoMetadata = common.getValueByPath(fromObject, [
        'videoMetadata',
    ]);
    if (fromVideoMetadata != null) {
        common.setValueByPath(toObject, ['videoMetadata'], fromVideoMetadata);
    }
    return toObject;
}
export function toolConfigToMldev(fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = common.getValueByPath(fromObject, [
        'functionCallingConfig',
    ]);
    if (fromFunctionCallingConfig != null) {
        common.setValueByPath(toObject, ['functionCallingConfig'], functionCallingConfigToMldev(fromFunctionCallingConfig));
    }
    const fromRetrievalConfig = common.getValueByPath(fromObject, [
        'retrievalConfig',
    ]);
    if (fromRetrievalConfig != null) {
        common.setValueByPath(toObject, ['retrievalConfig'], fromRetrievalConfig);
    }
    return toObject;
}
export function toolToMldev(fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = common.getValueByPath(fromObject, [
        'functionDeclarations',
    ]);
    if (fromFunctionDeclarations != null) {
        let transformedList = fromFunctionDeclarations;
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return item;
            });
        }
        common.setValueByPath(toObject, ['functionDeclarations'], transformedList);
    }
    if (common.getValueByPath(fromObject, ['retrieval']) !== undefined) {
        throw new Error('retrieval parameter is not supported in Gemini API.');
    }
    const fromGoogleSearchRetrieval = common.getValueByPath(fromObject, [
        'googleSearchRetrieval',
    ]);
    if (fromGoogleSearchRetrieval != null) {
        common.setValueByPath(toObject, ['googleSearchRetrieval'], fromGoogleSearchRetrieval);
    }
    const fromComputerUse = common.getValueByPath(fromObject, ['computerUse']);
    if (fromComputerUse != null) {
        common.setValueByPath(toObject, ['computerUse'], fromComputerUse);
    }
    const fromFileSearch = common.getValueByPath(fromObject, ['fileSearch']);
    if (fromFileSearch != null) {
        common.setValueByPath(toObject, ['fileSearch'], fromFileSearch);
    }
    const fromCodeExecution = common.getValueByPath(fromObject, [
        'codeExecution',
    ]);
    if (fromCodeExecution != null) {
        common.setValueByPath(toObject, ['codeExecution'], fromCodeExecution);
    }
    if (common.getValueByPath(fromObject, ['enterpriseWebSearch']) !== undefined) {
        throw new Error('enterpriseWebSearch parameter is not supported in Gemini API.');
    }
    const fromGoogleMaps = common.getValueByPath(fromObject, ['googleMaps']);
    if (fromGoogleMaps != null) {
        common.setValueByPath(toObject, ['googleMaps'], googleMapsToMldev(fromGoogleMaps));
    }
    const fromGoogleSearch = common.getValueByPath(fromObject, ['googleSearch']);
    if (fromGoogleSearch != null) {
        common.setValueByPath(toObject, ['googleSearch'], googleSearchToMldev(fromGoogleSearch));
    }
    const fromUrlContext = common.getValueByPath(fromObject, ['urlContext']);
    if (fromUrlContext != null) {
        common.setValueByPath(toObject, ['urlContext'], fromUrlContext);
    }
    return toObject;
}
export function toolToVertex(fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = common.getValueByPath(fromObject, [
        'functionDeclarations',
    ]);
    if (fromFunctionDeclarations != null) {
        let transformedList = fromFunctionDeclarations;
        if (Array.isArray(transformedList)) {
            transformedList = transformedList.map((item) => {
                return functionDeclarationToVertex(item);
            });
        }
        common.setValueByPath(toObject, ['functionDeclarations'], transformedList);
    }
    const fromRetrieval = common.getValueByPath(fromObject, ['retrieval']);
    if (fromRetrieval != null) {
        common.setValueByPath(toObject, ['retrieval'], fromRetrieval);
    }
    const fromGoogleSearchRetrieval = common.getValueByPath(fromObject, [
        'googleSearchRetrieval',
    ]);
    if (fromGoogleSearchRetrieval != null) {
        common.setValueByPath(toObject, ['googleSearchRetrieval'], fromGoogleSearchRetrieval);
    }
    const fromComputerUse = common.getValueByPath(fromObject, ['computerUse']);
    if (fromComputerUse != null) {
        common.setValueByPath(toObject, ['computerUse'], fromComputerUse);
    }
    if (common.getValueByPath(fromObject, ['fileSearch']) !== undefined) {
        throw new Error('fileSearch parameter is not supported in Vertex AI.');
    }
    const fromCodeExecution = common.getValueByPath(fromObject, [
        'codeExecution',
    ]);
    if (fromCodeExecution != null) {
        common.setValueByPath(toObject, ['codeExecution'], fromCodeExecution);
    }
    const fromEnterpriseWebSearch = common.getValueByPath(fromObject, [
        'enterpriseWebSearch',
    ]);
    if (fromEnterpriseWebSearch != null) {
        common.setValueByPath(toObject, ['enterpriseWebSearch'], fromEnterpriseWebSearch);
    }
    const fromGoogleMaps = common.getValueByPath(fromObject, ['googleMaps']);
    if (fromGoogleMaps != null) {
        common.setValueByPath(toObject, ['googleMaps'], fromGoogleMaps);
    }
    const fromGoogleSearch = common.getValueByPath(fromObject, ['googleSearch']);
    if (fromGoogleSearch != null) {
        common.setValueByPath(toObject, ['googleSearch'], fromGoogleSearch);
    }
    const fromUrlContext = common.getValueByPath(fromObject, ['urlContext']);
    if (fromUrlContext != null) {
        common.setValueByPath(toObject, ['urlContext'], fromUrlContext);
    }
    return toObject;
}
export function updateCachedContentConfigToMldev(fromObject, parentObject) {
    const toObject = {};
    const fromTtl = common.getValueByPath(fromObject, ['ttl']);
    if (parentObject !== undefined && fromTtl != null) {
        common.setValueByPath(parentObject, ['ttl'], fromTtl);
    }
    const fromExpireTime = common.getValueByPath(fromObject, ['expireTime']);
    if (parentObject !== undefined && fromExpireTime != null) {
        common.setValueByPath(parentObject, ['expireTime'], fromExpireTime);
    }
    return toObject;
}
export function updateCachedContentConfigToVertex(fromObject, parentObject) {
    const toObject = {};
    const fromTtl = common.getValueByPath(fromObject, ['ttl']);
    if (parentObject !== undefined && fromTtl != null) {
        common.setValueByPath(parentObject, ['ttl'], fromTtl);
    }
    const fromExpireTime = common.getValueByPath(fromObject, ['expireTime']);
    if (parentObject !== undefined && fromExpireTime != null) {
        common.setValueByPath(parentObject, ['expireTime'], fromExpireTime);
    }
    return toObject;
}
export function updateCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = common.getValueByPath(fromObject, ['name']);
    if (fromName != null) {
        common.setValueByPath(toObject, ['_url', 'name'], t.tCachedContentName(apiClient, fromName));
    }
    const fromConfig = common.getValueByPath(fromObject, ['config']);
    if (fromConfig != null) {
        updateCachedContentConfigToMldev(fromConfig, toObject);
    }
    return toObject;
}
export function updateCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = common.getValueByPath(fromObject, ['name']);
    if (fromName != null) {
        common.setValueByPath(toObject, ['_url', 'name'], t.tCachedContentName(apiClient, fromName));
    }
    const fromConfig = common.getValueByPath(fromObject, ['config']);
    if (fromConfig != null) {
        updateCachedContentConfigToVertex(fromConfig, toObject);
    }
    return toObject;
}
