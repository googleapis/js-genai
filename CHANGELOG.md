# Changelog


## [0.7.0](https://github.com/googleapis/js-genai/compare/v0.6.1...v0.7.0) (2025-03-27)


### ⚠ BREAKING CHANGES

* Change File.sizeBytes from number type to string type

### Features

* Add experimental generate_video support ([0fa1f05](https://github.com/googleapis/js-genai/commit/0fa1f053e3904f72218ad19b44e42acf180e8364))
* add MediaModalities for ModalityTokenCount ([9869098](https://github.com/googleapis/js-genai/commit/98690986bccb7e13707cd283a71c7ce6e1ccccb0))


### Bug Fixes

* Change File.sizeBytes from number type to string type ([184c7db](https://github.com/googleapis/js-genai/commit/184c7db957e7abb0e572660272f717f1b40abac1))
* Update tLiveClienttToolResponse() to accept FunctionResponse[] ([4cab8bf](https://github.com/googleapis/js-genai/commit/4cab8bfe19dab6ac6708e9d3f6e5ab6bba6969f1))

## [0.6.1](https://github.com/googleapis/js-genai/compare/v0.6.0...v0.6.1) (2025-03-25)


### Features

* Add engine to VertexAISearch ([69dfbaf](https://github.com/googleapis/js-genai/commit/69dfbaf95c6e0c98d962ef7172aa41a455ecbdc1))
* allow title property to be sent to Gemini API. Gemini API now supports the title property, so it's ok to pass this onto both Vertex and Gemini API. ([c5855a3](https://github.com/googleapis/js-genai/commit/c5855a310b02fcf2d12ec5d23a7f7fac943aa22f))
* implement files.delete for JS client SDK. ([4ac44de](https://github.com/googleapis/js-genai/commit/4ac44de9b1cb5d71274b24287149b39a3b934257))
* Save prompt safety attributes in dedicated field for generate_images ([1a774fa](https://github.com/googleapis/js-genai/commit/1a774fa18db4ca26bc97e1947f308837b16620ae))


### Bug Fixes

* schema transformer logic fix. ([6311f60](https://github.com/googleapis/js-genai/commit/6311f60539a12f6a0287c746c1367904af274197))

## [0.6.0](https://github.com/googleapis/js-genai/compare/v0.5.0...v0.6.0) (2025-03-20)


### ⚠ BREAKING CHANGES

* Unexport Content converter functions

### Features

* add IMAGE_SAFTY enum value to FinishReason ([81ae907](https://github.com/googleapis/js-genai/commit/81ae907a997d6f2e0a98d6b06906fdcfc0bb3770))


### Code Refactoring

* Separate converter functions to dedicated _{module}_converters.ts file for readability ([bb9ba98](https://github.com/googleapis/js-genai/commit/bb9ba987ffb1cd55647c0a2adaee9b7096b0b974))

## [0.5.0](https://github.com/googleapis/js-genai/compare/v0.4.0...v0.5.0) (2025-03-20)


### ⚠ BREAKING CHANGES

* Make "turnComplete:true" the default.

### Features

* Add sendClientContent, sendRealtimeInput, sendToolResponse to live session ([e7ec3c0](https://github.com/googleapis/js-genai/commit/e7ec3c087f628faea7c689e36a46a17e9530ead2))
* Make "turnComplete:true" the default. ([5f77e3e](https://github.com/googleapis/js-genai/commit/5f77e3e05c8ab95907082921eb99728b46503766))
* Support Google Cloud Express for Vertex AI ([e15c7f3](https://github.com/googleapis/js-genai/commit/e15c7f3675cbf703341ed3a39a75c038f07eb687))
* support new UsageMetadata fields ([fe000ed](https://github.com/googleapis/js-genai/commit/fe000ed1c8b74fd274d0bfae1271c317c232cb28))
* Support Vertex AI on browser runtimes ([e15c7f3](https://github.com/googleapis/js-genai/commit/e15c7f3675cbf703341ed3a39a75c038f07eb687))
* Upgrade the SDK launch stage to preview. ([da38b6d](https://github.com/googleapis/js-genai/commit/da38b6df88705c8ff1ea9a2e1c5ffa596054b382))

## [0.4.0](https://github.com/googleapis/js-genai/compare/v0.3.1...v0.4.0) (2025-03-14)


### ⚠ BREAKING CHANGES

* remove the createPartFromVideoMetadata usability function.

### Features

* enable union type for Schema when calling Gemini API. ([180983c](https://github.com/googleapis/js-genai/commit/180983c05857344d00133561aeae1e7a46e3475a))
* Provide a better error message when trying to use VertexAI in browsers. ([1ab1402](https://github.com/googleapis/js-genai/commit/1ab14020720e6d0bb47da7785b74aa06fffafca2))
* Support returned safety attributes for generate_images ([a0e0fcf](https://github.com/googleapis/js-genai/commit/a0e0fcfae5b9f6be4d2c9bd2466c91628bfd8623))
* throw exception when given method is not supported in Gemini API or Vertex AI ([96ccb6f](https://github.com/googleapis/js-genai/commit/96ccb6f9d578749fb485735be7f1b164da444029))


### Bug Fixes

* remove the createPartFromVideoMetadata usability function. ([d660a7f](https://github.com/googleapis/js-genai/commit/d660a7f57d3d54239a30fca0a2aeb486b476e7e5))

## 0.3.1 (2025-03-11)

## 0.3.0 (2025-03-11)


### ⚠ BREAKING CHANGES

* Make file.upload use named parameters.

### Features

* Enable Live for Vertex AI. ([2bda9d4](https://github.com/googleapis/js-genai/commit/2bda9d407712fbdab127ee7797572ac520b32423))


### Bug Fixes


* Set web as the browser entry points for bundlers that don't support the exports key ([18cb728](https://github.com/googleapis/js-genai/commit/18cb7283665f42fc9c7243ad9b82545c551e7444))

### Miscellaneous Chores

* Make file.upload use named parameters. ([60433f4](https://github.com/googleapis/js-genai/commit/60433f41b770d3c0a1e3cbbb50a2cea985396426))
