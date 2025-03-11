# Changelog

## 1.0.0 (2025-03-11)


### ⚠ BREAKING CHANGES

* Vertex AI is not yet supported.
* Vertex AI is not yet supported.
* stricter live connect callback setup
* split methods sending different client messages over the websocket connection.
* Rename Client to GoogleGenAI, Rename ClientInitOptions to GoogleGenAIOptions
* Support named parameters in TypeScript
* remove "tuning.distill"
* make Part, FunctionDeclaration, Image, and GenerateContentResponse classmethods argument keyword only
* rename generate_image() to generate_images(), rename GenerateImageConfig to GenerateImagesConfig, rename GenerateImageResponse to GenerateImagesResponse, rename GenerateImageParameters to GenerateImagesParameters

### Features

* [genai-modules][models] Add HttpOptions to all method configs for models. ([488291c](https://github.com/googleapis/js-genai/commit/488291cdc2772ecfb0a65e7d2ef87fc78a481000))
* [web compatibility] Introduce WebClient - a web compatible client. ([5831ee5](https://github.com/googleapis/js-genai/commit/5831ee566f44861f044898c9e08ce67bc8634e85))
* Add enhanced_prompt to GeneratedImage class ([7359709](https://github.com/googleapis/js-genai/commit/735970904003b6f65d947a416123985b338fef42))
* Add labels for GenerateContent requests ([8d56880](https://github.com/googleapis/js-genai/commit/8d56880403eac26694276cfb0c4ec54f7dfa4fff))
* Add response_id and create_time to GenerateContentResponse ([039266c](https://github.com/googleapis/js-genai/commit/039266c00f9e333f1901c0af0cd28255182aaa7e))
* Add support for enhance_prompt to model.generate_image ([1fd4a38](https://github.com/googleapis/js-genai/commit/1fd4a3894c69852924d338a6d7a72df9f5368e56))
* Add support for file.upload for browser implementation. ([015a069](https://github.com/googleapis/js-genai/commit/015a069ad78c66d7c6ffa93a152a50458435ad38))
* Add support for file.upload for nodejs implementation. ([2db321b](https://github.com/googleapis/js-genai/commit/2db321be15756ffa9c9f7b7d46eaefe181546650))
* Allow non-content types in generate_content ([824f66e](https://github.com/googleapis/js-genai/commit/824f66eb62a611982814bc72fde9674336cb18cb))
* Allow passing in multiple non-content types to generateContent. ([83a51d4](https://github.com/googleapis/js-genai/commit/83a51d436da1c7825ac52adc6c5b6b244542e437))
* Allow setting full url in baseUrl. ([c42911a](https://github.com/googleapis/js-genai/commit/c42911ae2c842accd58c19538d5acb99b115b70f))
* **chats:** Implement get history to return comprehensive or curated chat history ([d0d93bf](https://github.com/googleapis/js-genai/commit/d0d93bffc4d9f595a3ca4ff0deca57d2709d541a))
* **chats:** Support named parameters and per-request config override ([9875c18](https://github.com/googleapis/js-genai/commit/9875c18d368d6900f5233bf087a160bd2322a6a8))
* **CI:** Enhance lint checks to compare count from PR and main branch ([aecca2f](https://github.com/googleapis/js-genai/commit/aecca2f259a39674b656d65a482592b9dc4d64dc))
* Enable eslint and typescript-eslint ([a9b9694](https://github.com/googleapis/js-genai/commit/a9b96945570d2d64f96d2875756ab2b21422d242))
* Enable Live API initial connect to accept functions directly, in addition to just FunctionDeclaration ([6cefe2b](https://github.com/googleapis/js-genai/commit/6cefe2bafb3dc3f84350013323199add9615c08c))
* Enable Media resolution for Gemini API. ([adedef5](https://github.com/googleapis/js-genai/commit/adedef58f029041c76931438c8d55f9824781f78))
* Enable minItem, maxItem, nullable for Schema type when calling Gemini API. ([de76d97](https://github.com/googleapis/js-genai/commit/de76d97080d9bff847072182149ad7faa0e95536))
* Enabled HttpOptions for all methods on the configs. ([6a46548](https://github.com/googleapis/js-genai/commit/6a4654879530e2ffce92b7165771f0ad620e1448))
* Enforce required and optional fields for SDK method parameters ([b1c6441](https://github.com/googleapis/js-genai/commit/b1c6441c619bcc1c492cdfba60f37c2d7adb2bc5))
* Images - Added Image.mime_type ([dd8277a](https://github.com/googleapis/js-genai/commit/dd8277aea3548500ac30963904bab5b42281e0ee))
* Implement pager support in NodeJS SDK. ([7ec1eed](https://github.com/googleapis/js-genai/commit/7ec1eed1cf798168b4f96155d5e82494ad7288ed))
* Introduce a cross platform client. ([e53bbf1](https://github.com/googleapis/js-genai/commit/e53bbf193471026431edc9c8500061bf07eb1b75))
* Introduce a strong type 'HttpRequest' to replace 'any' as the request object ([bb338f6](https://github.com/googleapis/js-genai/commit/bb338f6eaeee35da9448e3122b874ce65e1aeee9))
* Introduce createUserContent and createModelContent usability functions to facilitate easier content creation for user role and model role, respectively. ([160aa10](https://github.com/googleapis/js-genai/commit/160aa10592807cae9f2aef1c5dfc20e277faa5a2))
* Introduce GenerateContentResponse quick accessor executableCode and codeExecutionResult ([0ccfbf4](https://github.com/googleapis/js-genai/commit/0ccfbf4bc50bc894d7a19ac3ad973ea99e1072c7))
* **js:** Add intermediate wrapper allowing us to always return full response. ([67a6987](https://github.com/googleapis/js-genai/commit/67a698772a9c24b3c27861a323cf61cf9171188a))
* Make Part, FunctionDeclaration, Image, and GenerateContentResponse classmethods argument keyword only ([598bfcd](https://github.com/googleapis/js-genai/commit/598bfcd898fa992fca07092e4b8748a6d05679d7))
* **pagers:** Consolidate BasePager and Pager into one class ([cc2583c](https://github.com/googleapis/js-genai/commit/cc2583c2227dc91e7e5a3fb626d2a6a4061ac49a))
* Split methods sending different client messages over the websocket connection. ([6844e7b](https://github.com/googleapis/js-genai/commit/6844e7b38402552067f8f815f3d064b036230bd0))
* Stricter live connect callback setup ([8e5e2a8](https://github.com/googleapis/js-genai/commit/8e5e2a81122300149ec55c0796a63e27f7bb2c21))
* Support aspect ratio for edit_image ([69edf3e](https://github.com/googleapis/js-genai/commit/69edf3e10bc066a414ee79a2f57cc5a6b281fc53))
* Support automatic function calling in models.generate_content_stream and send_message_stream, sync and async mode ([06ffdfa](https://github.com/googleapis/js-genai/commit/06ffdfa8e9cdba1f32cb59bba7789a09b1a955e6))
* Support named parameters in TypeScript ([272afa0](https://github.com/googleapis/js-genai/commit/272afa019d20360184368c71cc1484fb72e216e5))
* Support property_ordering in response_schema (fixes [#236](https://github.com/googleapis/js-genai/issues/236)) ([12f82a3](https://github.com/googleapis/js-genai/commit/12f82a342b5900e780af0136ae5a43c9bb568625))
* Support returning Pagers for all list methods in NodeJS SDK ([11be238](https://github.com/googleapis/js-genai/commit/11be238fc056b46cdb4d23079635e1a1d99ee108))
* Support Tunings.tune() method in SDK ([a58236d](https://github.com/googleapis/js-genai/commit/a58236d86a9d2cdeb3c414107aa3d680d3b215e8))
* Support web compatible WebSocket implementation in Live SDK ([ec4c588](https://github.com/googleapis/js-genai/commit/ec4c5889956d493996a82ee6a433dd1057938709))
* Update tSchema to only process Schema types ([bf33f2f](https://github.com/googleapis/js-genai/commit/bf33f2f487bb3ddf2f5ad34365bc86dc304d66a1))


### Bug Fixes

* Add fs/promise to rollup.config.mjs ([c7c2b98](https://github.com/googleapis/js-genai/commit/c7c2b9872c08bd5f876db2e993e57c08f091c97c))
* Adds /models to the transformer for cache, this failure was obscured by the fact that we did not check requests. ([f3b2f45](https://github.com/googleapis/js-genai/commit/f3b2f45b3814e76cd4f8a09df2563e2058220f7c))
* Allow user do batch generate content when passing a list of strings ([824f66e](https://github.com/googleapis/js-genai/commit/824f66eb62a611982814bc72fde9674336cb18cb))
* Avoid linting error of of-unused-vars by add a parentObject in function only when required. ([36fcfb3](https://github.com/googleapis/js-genai/commit/36fcfb37f58dd74f903421456e292174edf7fe1d))
* Change the main entry point to dist/src/index.js ([280e67b](https://github.com/googleapis/js-genai/commit/280e67b2e7608c07eae54cc1b157584da6ad2476))
* Fix the local coverage report. ([7b84fd1](https://github.com/googleapis/js-genai/commit/7b84fd186b8221a8521c968676c12bf51adf5eda))
* Fix the main and module entry points ([b5ed18a](https://github.com/googleapis/js-genai/commit/b5ed18a2a6cb7bac0fbe928b3a8e691949e58220))
* Fix the part that breaks the system test. ([506cc6e](https://github.com/googleapis/js-genai/commit/506cc6ece53a03c725ff800309f4ba7dcc4f1093))
* Include missing dependency ([d7b9b5c](https://github.com/googleapis/js-genai/commit/d7b9b5cc303c57ae01b06ecb1d7baff60974842a))
* Include web types in the npm package (fix typo) ([27217fa](https://github.com/googleapis/js-genai/commit/27217fab0a465d6f1143a21759afe333504254df))
* Log warn instead of throw error for GenerateContentResponse.text() quick accessor when there are mixed types of parts in the first candidate. ([de66ec2](https://github.com/googleapis/js-genai/commit/de66ec29601f4834f9717fb5cd4b1d44f817106b))
* **pagers:** Fix list with pagers ([6b3caa8](https://github.com/googleapis/js-genai/commit/6b3caa87c72a2f2efbeea5f13440860011d93dba))
* Re ordered the conversion code to ensure that multiple contents are respected on the embed content pipeline. ([f37a381](https://github.com/googleapis/js-genai/commit/f37a381f8c103aac53346dc5137a62c7bde9da8f))
* Remove the unused code. ([39c100d](https://github.com/googleapis/js-genai/commit/39c100d919531083a942631cdef7284fe9f07007))
* Remove unsupported parameter from Gemini API ([2df0017](https://github.com/googleapis/js-genai/commit/2df00175e6f6a92c1826503cdd3e5efbdd0cae79))
* Remove unsupported parameter negative_prompt from Gemini API generate_images ([6a12451](https://github.com/googleapis/js-genai/commit/6a124514442731ef9c3a072947f272095e2282fd))
* Replace the `any` type in the SDK to `unknown`. ([e17499e](https://github.com/googleapis/js-genai/commit/e17499e4661664cd0c1e8dc62b8830f7ef297de2))
* Set web as the browser entry points for bundlers that don't support the exports key ([18cb728](https://github.com/googleapis/js-genai/commit/18cb7283665f42fc9c7243ad9b82545c551e7444))
* Update live to pass along headers in the Node websocket ([ea92c33](https://github.com/googleapis/js-genai/commit/ea92c3342e91efcfd25291a6e03edd5521f29e0c))
* Update message handling based on incoming event.data type ([ea92c33](https://github.com/googleapis/js-genai/commit/ea92c3342e91efcfd25291a6e03edd5521f29e0c))
* Update the construction of URL to avoid additonal slashes. ([6da80a9](https://github.com/googleapis/js-genai/commit/6da80a9306dcbdc4a1265fcce7dfaff2db87f1fa))
* Update the web sample to use text accessor ([15cce93](https://github.com/googleapis/js-genai/commit/15cce938acedfd6c509066c7b861377fa5a07d6d))
* Yield one chunk in streaming api ([2b76144](https://github.com/googleapis/js-genai/commit/2b76144472b21481d14bd51ee6eac517ca795137))


### Miscellaneous Chores

* Vertex AI is not yet supported. ([2bda9d4](https://github.com/googleapis/js-genai/commit/2bda9d407712fbdab127ee7797572ac520b32423))
* Vertex AI is not yet supported. ([f54a44d](https://github.com/googleapis/js-genai/commit/f54a44dbdcc2e5c9e435991db809df0ea487be3f))


### Code Refactoring

* Remove "tuning.distill" ([fb3aae8](https://github.com/googleapis/js-genai/commit/fb3aae886acd5a0e3750f2bcdc6d890845dc68f1))
* Rename Client to GoogleGenAI, Rename ClientInitOptions to GoogleGenAIOptions ([1072cc3](https://github.com/googleapis/js-genai/commit/1072cc3d85b0b478296126865578ec1dbe55e617))
* Rename generate_image() to generate_images(), rename GenerateImageConfig to GenerateImagesConfig, rename GenerateImageResponse to GenerateImagesResponse, rename GenerateImageParameters to GenerateImagesParameters ([a99d481](https://github.com/googleapis/js-genai/commit/a99d48127c08fb063a9cb84678df889377bb7b7e))

## Changelog
