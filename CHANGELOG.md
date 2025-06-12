# Changelog


## [1.5.0](https://github.com/googleapis/js-genai/compare/v1.4.0...v1.5.0) (2025-06-12)


### Features

* add a timeout parameter to CallableToolConfig ([06f31fd](https://github.com/googleapis/js-genai/commit/06f31fdbb8be612759385190c6a03ea03d103dcf))
* Add datastore_spec field for VertexAISearch ([1b18a52](https://github.com/googleapis/js-genai/commit/1b18a527ab4b9526a8901ecdc0453795df0905bf))
* Add support for Veo frame interpolation and video extension ([53f22e6](https://github.com/googleapis/js-genai/commit/53f22e6ce54dc0b226145e9bcba20b731ea4645f))
* Make the MCP SDK an optional peer dependency. ([2472fd3](https://github.com/googleapis/js-genai/commit/2472fd364a29ad3cf3e15bbb61a1f3ac00914d86))
* RAG - Introducing context storing for Gemini Live API. ([bdc2355](https://github.com/googleapis/js-genai/commit/bdc2355f2f10b839aa95162216dc4d35c60cd58e))


### Bug Fixes

* Prioritize credentials over implicit api key (from env) for node client using Vertex AI ([d82aba2](https://github.com/googleapis/js-genai/commit/d82aba244bdb804b063ef8a983b2916c00b901d2)), closes [#616](https://github.com/googleapis/js-genai/issues/616)

## [1.4.0](https://github.com/googleapis/js-genai/compare/v1.3.0...v1.4.0) (2025-06-04)


### Features

* Add enhance_prompt field for Gemini Developer API generate_videos ([ea3cc8e](https://github.com/googleapis/js-genai/commit/ea3cc8e8eae1df3dd1cc7fe0a897a12705c51a59))
* Enable url_context for Vertex ([e377f58](https://github.com/googleapis/js-genai/commit/e377f583747d1546fbc9ea1412c9c51bdf11c977))
* **js:** Support `GEMINI_API_KEY` as environment variable for setting API key. ([97850ad](https://github.com/googleapis/js-genai/commit/97850ada42304ef6877523a9c3006303abcfea2a))


### Bug Fixes

* defined Type becomes TYPE_UNSPECIFIED when obfuscation is enabled ([1ddf4f5](https://github.com/googleapis/js-genai/commit/1ddf4f5e19b774588d5d51fcc854c9cdad31bd61))
* Update live SDK sample to address choppy audio quality ([319bcbb](https://github.com/googleapis/js-genai/commit/319bcbbec8164b84c1f5a052435dcf62713572d5))
* use Enum's value instead of keys for obfuscation. ([132bd04](https://github.com/googleapis/js-genai/commit/132bd04913ccacbd317cd7273c318059b57e42fb))

## [1.3.0](https://github.com/googleapis/js-genai/compare/v1.2.0...v1.3.0) (2025-05-30)


### Features

* Adding `thought_signature` field to the `Part` to store the signature for thoughts. ([20815b2](https://github.com/googleapis/js-genai/commit/20815b269a0154c52787d9b26e053a089154ca3c))
* include UNEXPECTED_TOOL_CALL enum value to FinishReason for Vertex AI APIs. ([bd5a2bf](https://github.com/googleapis/js-genai/commit/bd5a2bf87d6d927b0286ff80871a8a2a85a09c0c))
* Support ephemeral auth tokens as API keys for live connections in TS. ([507bfb5](https://github.com/googleapis/js-genai/commit/507bfb5a4a1d8cb3fbcb67c28d8b3dfcb5c35dcb))
* Support ephemeral token creation in TS ([425cfe6](https://github.com/googleapis/js-genai/commit/425cfe62eea596fd6ac2463aef664d5163258c4e))


### Bug Fixes

* Rename LiveEphemeralParameters to LiveConnectConstraints. ([86e9652](https://github.com/googleapis/js-genai/commit/86e96524049e5576e240cf9cf22bd8af340e2e18))

## [1.2.0](https://github.com/googleapis/js-genai/compare/v1.1.0...v1.2.0) (2025-05-28)


### ⚠ BREAKING CHANGES TO EXPERIMENTAL FEATURES

* Remove unsupported Lyria enum for music generation mode

### Features

* Add generate_audio field for private testing of video generation ([37e14c5](https://github.com/googleapis/js-genai/commit/37e14c5bb29a26733601548acf109f8c0b25bbfb))


### Documentation

* fix README typo ([04259ad](https://github.com/googleapis/js-genai/commit/04259ad8ebb07663bd3935ee8142ffda3c9b1dff))


### Miscellaneous Chores

* Remove unsupported Lyria enum for music generation mode ([0b935cd](https://github.com/googleapis/js-genai/commit/0b935cdbe3ac10a1741619d946e865f352ba3333))

## [1.1.0](https://github.com/googleapis/js-genai/compare/v1.0.1...v1.1.0) (2025-05-26)


### Features

* Add CommonJS modules ([f40c47c](https://github.com/googleapis/js-genai/commit/f40c47c8b2fd275bd8536f889bef21f2ec1faf05))
* support new fields in FileData, GenerationConfig, GroundingChunkRetrievedContext, RetrievalConfig, Schema, TuningJob, VertexAISearch, ([cd04548](https://github.com/googleapis/js-genai/commit/cd0454862b4a0251d2606eeca8500b3b76004944))

## [1.0.1](https://github.com/googleapis/js-genai/compare/v1.0.0...v1.0.1) (2025-05-22)

> [!NOTE]
> This version drops support for end-of-life Node.js v18.

### Bug Fixes

* After an error on sendMessage, all subsequent calls fail with the same error ([778abcc](https://github.com/googleapis/js-genai/commit/778abccceffb5148762ed35d53c7e957d3284aee))
* Fixed sendMessage subsequent calls test to follow the arrange-act-assert pattern ([778abcc](https://github.com/googleapis/js-genai/commit/778abccceffb5148762ed35d53c7e957d3284aee))
* Unbreak direct `require`s from node. ([023efd5](https://github.com/googleapis/js-genai/commit/023efd5a4c225451a494dcf6c7785bbdc40b83ea))

## [1.0.0](https://github.com/googleapis/js-genai/compare/v0.15.0...v1.0.0) (2025-05-19)


### ⚠ BREAKING CHANGES

* Fix Lyria method name for JS, update parameters type

### Features

* Support ephemeral token creation in Python ([8e12730](https://github.com/googleapis/js-genai/commit/8e127309f071d243779acf6cc32b2e7e0d388679))
* Support using ephemeral token in Live session connection in Python ([8e12730](https://github.com/googleapis/js-genai/commit/8e127309f071d243779acf6cc32b2e7e0d388679))


### Bug Fixes

* allow McpClient to be passed in with AFC disabled. ([b13f1f8](https://github.com/googleapis/js-genai/commit/b13f1f8d0a4a81140486a63e9e02ff2f7fcca17e))
* Blob handling in realtime music ([f760755](https://github.com/googleapis/js-genai/commit/f760755c88e3915e61666408419136816d99acd5))
* Prevent MCP label from being appended multiple times if they already exist ([c59ffe7](https://github.com/googleapis/js-genai/commit/c59ffe7cc04594d50557a697ad45b72d7cadc35b))


### Documentation

* No longer preview. ([5e137d4](https://github.com/googleapis/js-genai/commit/5e137d487a4230da40ee1218e5b8b9c2ac68e6bd))


### Miscellaneous Chores

* Fix Lyria method name for JS, update parameters type ([99dba6e](https://github.com/googleapis/js-genai/commit/99dba6e695ac7266d1bd469813466f22ec4174f6))

## [0.15.0](https://github.com/googleapis/js-genai/compare/v0.14.1...v0.15.0) (2025-05-19)


### Features

* add `time range filter` to Google Search Tool ([a938111](https://github.com/googleapis/js-genai/commit/a93811117f7346eb860c8848aef4f309a1b1ddf5))
* Add basic support for async function calling. ([8e2f357](https://github.com/googleapis/js-genai/commit/8e2f3573f97ceb0468a2327751e76892c2979430))
* Add CallableToolConfig to specify behavior for FunctionDeclarations ([c4148d0](https://github.com/googleapis/js-genai/commit/c4148d0c711d17840cf9e6b2397dbbb8d8aeb7c1))
* add configurations for afc. ([ce7855b](https://github.com/googleapis/js-genai/commit/ce7855b96abdc098e52b388c6cc048a0c001f3ba))
* add live proactivity_audio and enable_affective_dialog ([20e3892](https://github.com/googleapis/js-genai/commit/20e3892d8a4e1216cbdab626e6066941f654ff9f))
* Add Lyria Realtime music generation support for JS ([aefcaa5](https://github.com/googleapis/js-genai/commit/aefcaa56c3198928892674f691ddbfa64d169197))
* Add Lyria Realtime Music Types ([99255d8](https://github.com/googleapis/js-genai/commit/99255d8bdb01ca165c19086fbd6094c426c2050b))
* Add MCP telemetry usage to TS SDK. ([09a83e9](https://github.com/googleapis/js-genai/commit/09a83e93f7289e9466aa0aca55369a1ea4576ffe))
* add multi-speaker voice config ([6fe6074](https://github.com/googleapis/js-genai/commit/6fe60740f0e2c918d521edc9c3d82a965451c6ff))
* Add support for lat/long in search. ([4cd79f6](https://github.com/googleapis/js-genai/commit/4cd79f6f68c75c8fcc3d28f3cc3a013b4818cf9e))
* Add support for MCP in TS SDK. ([921a4be](https://github.com/googleapis/js-genai/commit/921a4be90ccc3cf5fb330050acfdef0ac8d415fb))
* add support for propertyOrdering field. ([a77822b](https://github.com/googleapis/js-genai/commit/a77822bf8af27a8070c2a376b1561ec851a4b9a9))
* Add Video FPS, and enable start/end_offset for MLDev ([19f20e9](https://github.com/googleapis/js-genai/commit/19f20e9f4eec6e5c0e8c89fd339486ccdd8a363c))
* Enable AFC on Generate content stream ([ff2ce35](https://github.com/googleapis/js-genai/commit/ff2ce35746964dc8b32d97908c533618b962348f))
* export the createJsonSchemaValidator methods to be available for other library. ([b3359a1](https://github.com/googleapis/js-genai/commit/b3359a17cf5db85d19131748731e0d843c473035))
* List all mcp tools to max and mcpToTool taking a spread. ([44cd9c9](https://github.com/googleapis/js-genai/commit/44cd9c9fb1f78eee9351b1bac1ba5ba51ba08515))
* **MCP:** Add a new interface for automatic function calling ([dc49ffc](https://github.com/googleapis/js-genai/commit/dc49ffc0f248da55d11e14a2e5e71988968afe87))
* **MCP:** Add mcpToTool to pass MCP clients for automatic function calling ([825f385](https://github.com/googleapis/js-genai/commit/825f3858994af377f54c870df40f1a4e37d68a73))
* Remove MCP Tool and MCP Client from ToolUnion ([d35e16d](https://github.com/googleapis/js-genai/commit/d35e16d1ac0c4491648f33838028a21386e76993))
* support customer-managed encryption key in cached content ([3e7437a](https://github.com/googleapis/js-genai/commit/3e7437a70210f4075e904ce45f026bcf49d42297))
* Support Url Context Retrieval tool ([aaaf9a9](https://github.com/googleapis/js-genai/commit/aaaf9a9e6e694341edd972f67e33ded13bcb4e0c))


### Bug Fixes

* Add an ES module for node environments. ([ff4bbd1](https://github.com/googleapis/js-genai/commit/ff4bbd11f5f1b6cfe2082862625a2a7f4d062c8e))
* Add default headers to model calls when MCP is enabled ([9442eea](https://github.com/googleapis/js-genai/commit/9442eea9d1445b2f2a33ebbc1a65c64a011b8fd1))
* Allow contents with no-text thoughts in chat history ([4112d1c](https://github.com/googleapis/js-genai/commit/4112d1c9379d5f111c1226878ded702aaa3b8ab8))
* **chats:** Enforce internal management of chat history ([abe592f](https://github.com/googleapis/js-genai/commit/abe592f106fb33c79d1b3e5fcbcddb4d6572d853))
* **chats:** Relax the constraint on chat turns ([68115a8](https://github.com/googleapis/js-genai/commit/68115a8c2ff5fba5c8fd79cace52a4f1abca130f))
* make the system-test build. ([dd7154c](https://github.com/googleapis/js-genai/commit/dd7154ccde87e93753fbf61ec8aef132901c3bb0))
* move test-server-sdk from dependencies to devDependencies ([233a909](https://github.com/googleapis/js-genai/commit/233a909cc8537ece29a54440731c59601dc721d0))
* Move test-server-sdk to devDependencies ([#574](https://github.com/googleapis/js-genai/issues/574)) ([b64deeb](https://github.com/googleapis/js-genai/commit/b64deeb3a4e241fbf80e10b981c6ecc52e278863))
* Run tests against Node 24 ([28a56ac](https://github.com/googleapis/js-genai/commit/28a56ac2e592d1647c46e391e9207ab919c27f0b))
* Skip MCP tool call when function name not present in the tool ([9f3d360](https://github.com/googleapis/js-genai/commit/9f3d360a1d8dfdc740c0cabebfc74e6705183060))

## [0.14.1](https://github.com/googleapis/js-genai/compare/v0.14.0...v0.14.1) (2025-05-15)


### Bug Fixes

* Move test-server-sdk to devDependencies ([#574](https://github.com/googleapis/js-genai/issues/574)) ([5913e59](https://github.com/googleapis/js-genai/commit/5913e59c26f362147eafb1b883604b8be3641e09))

## [0.14.0](https://github.com/googleapis/js-genai/compare/v0.13.0...v0.14.0) (2025-05-13)


### Features

* Add Imagen edit_image support in JS SDK ([6c99936](https://github.com/googleapis/js-genai/commit/6c999365c457ceed083862f6b572f551f3e1dc63))
* Add Imagen upscale_image support for JS ([6fe1a68](https://github.com/googleapis/js-genai/commit/6fe1a687c4ff23b1df802b4fe88b1d24dabf3068))
* add support for audio, video, text and session resumption in java. ([e5542c6](https://github.com/googleapis/js-genai/commit/e5542c695d36059e7602b3f6c3ee398c33cfc4d9))
* support display_name for Blob class when calling Vertex AI ([fc35f51](https://github.com/googleapis/js-genai/commit/fc35f5178b576bdf6c134d7313fc6fd5e6c6ea93))
* Support tuning checkpoints ([6bd9c9e](https://github.com/googleapis/js-genai/commit/6bd9c9e9a1b3d0b69b05ae78d226842dd94ff110))

## [0.13.0](https://github.com/googleapis/js-genai/compare/v0.12.0...v0.13.0) (2025-05-07)


### Features

* Add `text` and `data` accessors to LiveServerMessage ([a3c4201](https://github.com/googleapis/js-genai/commit/a3c42011e8681d14e97f1b2b071789a814099c43))
* Add `Tool.enterprise_web_search` field ([29b097d](https://github.com/googleapis/js-genai/commit/29b097d5cc864c66f7259fadb6c4fe3c03246192))
* Add a models.list function to list available models. ([477d9ec](https://github.com/googleapis/js-genai/commit/477d9ecacfab28d30c8422e0eb38e27974422460))
* Add Files.download method. ([8f44c99](https://github.com/googleapis/js-genai/commit/8f44c99bf5e2503474d77688f13b3d746d236795))
* Add support for Grounding with Google Maps ([41f0cc2](https://github.com/googleapis/js-genai/commit/41f0cc29c949e05872051b5caef07d50caad86d4))
* enable input transcription for Gemini API. ([767c5d5](https://github.com/googleapis/js-genai/commit/767c5d5696dd8ef30e65d409c0716b9b5bb42b1a))
* Support global location (fixes [#502](https://github.com/googleapis/js-genai/issues/502)) ([ff906fb](https://github.com/googleapis/js-genai/commit/ff906fbc4c87b8fe8a842b5450e9b52f8025105d))


### Bug Fixes

* add retry logic for missing X-Goog-Upload-Status header for js ([8cf039e](https://github.com/googleapis/js-genai/commit/8cf039eef0e0bc031129e523f5032802ca8694dd))

## [0.12.0](https://github.com/googleapis/js-genai/compare/v0.11.0...v0.12.0) (2025-04-30)


### Features

* add support for live grounding metadata ([f5ed429](https://github.com/googleapis/js-genai/commit/f5ed429add42b71a90a9c986ca7c818759866085))

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
