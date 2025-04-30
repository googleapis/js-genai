# Changelog


## [0.11.0](https://github.com/googleapis/js-genai/compare/v0.10.0...v0.11.0) (2025-04-30)


### Features

* add models.delete and models.update to manage tuned models ([0766718](https://github.com/googleapis/js-genai/commit/076671891bca70cbd33f01b18d2dbfc1d60c4c13))
* Added support for Tuning operations ([d5a035f](https://github.com/googleapis/js-genai/commit/d5a035f9f5d682484821737c2b3fb5fda3b41256))
* make min_property, max_property, min_length, max_length, example, patter fields available for Schema class when calling Gemini API ([5f91ee7](https://github.com/googleapis/js-genai/commit/5f91ee780e0af3022b847043f07ed06455609300))


### Bug Fixes

* Apply converters to list items when the API value isn't an array ([249769f](https://github.com/googleapis/js-genai/commit/249769ff17989aa3d3f037f342fc12c26194421c))
* **chats:** Properly handle streaming errors to not throw an error that couldn't be caught, which might result in crash in web. Fixes [#487](https://github.com/googleapis/js-genai/issues/487) ([0b62e15](https://github.com/googleapis/js-genai/commit/0b62e15b0a0c1dff06c55b51df922bceb39bf58a))
* **CI:** Fix docs generation for release event ([899969e](https://github.com/googleapis/js-genai/commit/899969e4acef0261d58351547c3292de67d3aee1))
* Clean the CHANGELOG to remove the changes not included in the bundle. ([89b1d66](https://github.com/googleapis/js-genai/commit/89b1d668213a8f95d39ab55a1619aa4a89508605))
* do not raise error for `default` field in Schema for Gemini API calls ([6f72396](https://github.com/googleapis/js-genai/commit/6f7239655caab724320b75ce29d733a9a4a9b667))
* Don't transform lists twice ([249769f](https://github.com/googleapis/js-genai/commit/249769ff17989aa3d3f037f342fc12c26194421c))

## [0.10.0](https://github.com/googleapis/js-genai/compare/v0.9.0...v0.10.0) (2025-04-23)


### Features

* add additional realtime input fields ([2150416](https://github.com/googleapis/js-genai/commit/2150416bb255418ff22c77006b4f8fa907b1c69c))
* Add helper function `GenerateContentResponse.data` to return concatenation of all inline data parts. ([97b59a2](https://github.com/googleapis/js-genai/commit/97b59a29c0170ff7eabbecc8f6e335fd92d19aaa))
* Allow users to set AbortSignal inside per request config to cancel http request ([c44f48d](https://github.com/googleapis/js-genai/commit/c44f48d91a60c564abb904f0d3c1fe70f8d833c9))
* support `default` field in Schema when users call Gemini API ([2e61cce](https://github.com/googleapis/js-genai/commit/2e61cce3d45b1ab94d6b488286d918bbf7b3f41f))
* Support setting the default base URL in clients via setDefaultBaseUrls() ([df978b8](https://github.com/googleapis/js-genai/commit/df978b8c42fd5c634d9ad4ba8c42bc301807d492))
* Use ws:// for websockets established over http base URLs. ([774505b](https://github.com/googleapis/js-genai/commit/774505bd14a5b438464c4ab9a17da81b7c971d7c))


### Bug Fixes

* Return actual error text from streaming response ([808e0b5](https://github.com/googleapis/js-genai/commit/808e0b5e14023f1484eb01d3bc02d0e76e584d92)), closes [#346](https://github.com/googleapis/js-genai/issues/346)
* Update _api_client to parse and throw errors during processing stream responses (fixes [#461](https://github.com/googleapis/js-genai/issues/461)) ([1932f1d](https://github.com/googleapis/js-genai/commit/1932f1dd7d5012747918cb6f8f0dcbd9b4581838))

## [0.9.0](https://github.com/googleapis/js-genai/compare/v0.8.0...v0.9.0) (2025-04-17)


### ⚠ BREAKING CHANGES

* Simplified the types allowed on the generateContent contents parameter.

### Features

* add a helper module to process zod objecsts. ([fad2789](https://github.com/googleapis/js-genai/commit/fad278993bdb34202cf8d6ddc390d6abc467d62a))
* add support for model_selection_config to GenerateContentConfig ([37a9cae](https://github.com/googleapis/js-genai/commit/37a9cae47597d65c820e618d365af56255b56099))
* Expose transcription configurations for audio in TS, and move generationConfig to the top level LiveConnectConfig ([d3a841d](https://github.com/googleapis/js-genai/commit/d3a841d2db1845fc9ed278a30d509dc5c6e699a8))
* Simplified the types allowed on the generateContent contents parameter. ([324d158](https://github.com/googleapis/js-genai/commit/324d1588aa87ff07a76db79f4b71dcbabe63bb38))
* Support audio transcription in Vertex Live API ([8d11c04](https://github.com/googleapis/js-genai/commit/8d11c045dd17a141dfb6561030be05e3ccde92b0))
* Support RealtimeInputConfig, and language_code in SpeechConfig in python ([004ff6a](https://github.com/googleapis/js-genai/commit/004ff6a2f44072c96969ace22cffbf7679ad684b))
* Update VertexRagStore ([043d06c](https://github.com/googleapis/js-genai/commit/043d06cc4ca0db1593f7a28aaae9f012c0a60763))


### Bug Fixes

* **CI:** Fix stable docs generation with release event ([89c61b9](https://github.com/googleapis/js-genai/commit/89c61b904baf44f7c3738acf7e13177ac22cd387))

## [0.8.0](https://github.com/googleapis/js-genai/compare/v0.7.0...v0.8.0) (2025-04-09)


### Features

* Add domain to Web GroundingChunk ([dc56670](https://github.com/googleapis/js-genai/commit/dc56670247463694903e039e6a241a18c1fbc2cb))
* Add generationComplete notification to LiveServerContent ([4d9811b](https://github.com/googleapis/js-genai/commit/4d9811b452455d5e3462de4a21964a037c9e42bf))
* add session resumption to live module ([b5c6975](https://github.com/googleapis/js-genai/commit/b5c69758819c0313cdd883d07dc5e18891d46cd2))
* add session resumption. ([fff2b66](https://github.com/googleapis/js-genai/commit/fff2b66470fabcca4959aa4cfc80e350d776b91d))
* Add thinking_budget to ThinkingConfig for Gemini Thinking Models ([76e0e18](https://github.com/googleapis/js-genai/commit/76e0e183dea9dee7dd3ea14ed3dff3970d94a3c5))
* Add traffic type to GenerateContentResponseUsageMetadata ([d84156e](https://github.com/googleapis/js-genai/commit/d84156e0e0dfa40cdf0e0ebe3d9530acbf26251d))
* Add types for configurable speech detection ([fc861bc](https://github.com/googleapis/js-genai/commit/fc861bc2c01b9c391fdcf7a3aa1abff3a9ec809b))
* Add types to support continuous sessions with a sliding window ([0fd8256](https://github.com/googleapis/js-genai/commit/0fd825664b203e9594e2a5ea8524c8aefc5f7733))
* Add UsageMetadata to LiveServerMessage ([67b34f7](https://github.com/googleapis/js-genai/commit/67b34f70dd4433883feabf4a8d6a44a3dcb9b629))
* expose generation_complete, input/output_transcription & input/output_audio_transcription to SDK for Vertex Live API ([1e8be50](https://github.com/googleapis/js-genai/commit/1e8be506f635b910d421ef9b4d6f1785a4c94935))
* merge GenerationConfig into LiveConnectConfig ([d25d77d](https://github.com/googleapis/js-genai/commit/d25d77d442ab7e2408c59d0e0c88f02eeaa31d2f))
* Populate X-Server-Timeout header when a request timeout is set. ([6f00495](https://github.com/googleapis/js-genai/commit/6f0049540998f6344819177ccabccf9961d3b200))
* support media resolution ([9ebd58b](https://github.com/googleapis/js-genai/commit/9ebd58b8552a55e30f9f01a1ca34b5c3b8c2a44d))
* Support models.get() for getting model information ([fc62381](https://github.com/googleapis/js-genai/commit/fc62381883db7b837640038d320adb563cbb83e3))
* Update Live converters to pass along configurable speech detection parameters ([8301fa2](https://github.com/googleapis/js-genai/commit/8301fa2bd8e4d1312212ac3b47286ca69ef5cdf2))
* Update Live converters to pass along params to support continuous sessions with a sliding window ([3814d92](https://github.com/googleapis/js-genai/commit/3814d929a8a8a0eb37ccc71f575d49b90bda8e02))


### Bug Fixes

* Use authentication headers as provided by google-auth-library ([94b11a1](https://github.com/googleapis/js-genai/commit/94b11a1b6e62c60bb03b3d49c150bccf0b1d97c7))

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
