# Changelog


## [1.34.0](https://github.com/googleapis/js-genai/compare/v1.33.0...v1.34.0) (2025-12-16)


### Features

* Add minimal and medium thinking levels. ([19f8969](https://github.com/googleapis/js-genai/commit/19f8969f0cd9f423b10384d91a4ea8396a791d01))
* Add support for Struct in ToolResult Content. ([750a4f7](https://github.com/googleapis/js-genai/commit/750a4f79fea3198317a540563f04369302408a11))
* Add ultra high resolution to the media resolution in Parts. ([fa9a99e](https://github.com/googleapis/js-genai/commit/fa9a99e79d8c517011772a0edfe7c41c5d7518b7))
* Add ULTRA_HIGH MediaResolution and new ThinkingLevel enums ([b8a7d8c](https://github.com/googleapis/js-genai/commit/b8a7d8c98d29c9a121784796016b5d2674968799))
* Define and use DocumentMimeType for DocumentContent ([c2f118d](https://github.com/googleapis/js-genai/commit/c2f118df83b0a05a821f486c9126fe5967c1bf95))
* support multi speaker for Vertex AI ([94d681b](https://github.com/googleapis/js-genai/commit/94d681bba5f3280949fb852b4365f5f2bf8a82ee))

## [1.33.0](https://github.com/googleapis/js-genai/compare/v1.32.0...v1.33.0) (2025-12-11)


### Features

* Add IMAGE_RECITATION and IMAGE_OTHER enum values to FinishReason ([ab87f51](https://github.com/googleapis/js-genai/commit/ab87f51b8b2f0109d3ea89a18987c49101adfd70))
* Add voice activity detection signal. ([bff9695](https://github.com/googleapis/js-genai/commit/bff96959c8cec4ef710cb77551e944024884761f))
* Make the Interactions API public. ([a8dd67b](https://github.com/googleapis/js-genai/commit/a8dd67bc3267ed010c809fcd609d42811b042ebe))

## [1.32.0](https://github.com/googleapis/js-genai/compare/v1.31.0...v1.32.0) (2025-12-09)


### Features

* Add enableEnhancedCivicAnswers feature in GenerateContentConfig ([b429389](https://github.com/googleapis/js-genai/commit/b4293896f3ab718426c93c3507827955aeb51e37))
* Support ReplicatedVoiceConfig ([7a56e35](https://github.com/googleapis/js-genai/commit/7a56e35f7f4fb3beed903eb02817dd70c1a4b6a9))


### Bug Fixes

* Improve stream parsing performance ([c9c1359](https://github.com/googleapis/js-genai/commit/c9c13596365b495a66be3015c312936a38be6ebc))

## [1.31.0](https://github.com/googleapis/js-genai/compare/v1.30.0...v1.31.0) (2025-12-03)


### Features

* Add empty response for tunings.cancel() ([5dc25bc](https://github.com/googleapis/js-genai/commit/5dc25bcec56b0fdba1b893a332c915f2320ff0b8))

## [1.30.0](https://github.com/googleapis/js-genai/compare/v1.29.1...v1.30.0) (2025-11-18)


### Features

* add display name to FunctionResponseBlob ([81036ed](https://github.com/googleapis/js-genai/commit/81036edbea077b600d29c565c7dea5ad840d0fe0))
* add display name to FunctionResponseFileData ([564f718](https://github.com/googleapis/js-genai/commit/564f7180087ed35b69d5d0777a98a6992b7adb3e))
* Add generate_content_config.thinking_level ([4e586df](https://github.com/googleapis/js-genai/commit/4e586df51c403e12e5b715288e0fcd882b5aaf38))
* Add image output options to ImageConfig for Vertex ([fff5fb6](https://github.com/googleapis/js-genai/commit/fff5fb687be5630ec113c8c60114cbfc25156931))
* Add part.media_resolution ([4e586df](https://github.com/googleapis/js-genai/commit/4e586df51c403e12e5b715288e0fcd882b5aaf38))
* support Function call argument streaming for all languages ([b3b94f6](https://github.com/googleapis/js-genai/commit/b3b94f6e12e0895eac6b15ff54cc0ce3afd796e7))

## [1.29.1](https://github.com/googleapis/js-genai/compare/v1.29.0...v1.29.1) (2025-11-12)


### Bug Fixes

* Add missing fields to the model types ([8937903](https://github.com/googleapis/js-genai/commit/8937903299bf3180ec8eb806d189c642392f1546))
* Don't generate warnings from response.text property because of thought_signature. ([356b843](https://github.com/googleapis/js-genai/commit/356b84306542a972cc49ede11b24c8b0156d78eb))
* Fix base_steps parameter for recontext_image ([946415f](https://github.com/googleapis/js-genai/commit/946415ffc42bdc9bcf7f086aac9612ff7aaa89d2))

## [1.29.0](https://github.com/googleapis/js-genai/compare/v1.28.0...v1.29.0) (2025-11-05)


### Features

* add complete stats to BatchJob ([3263514](https://github.com/googleapis/js-genai/commit/3263514b69cfe4433401f6955a4bea9d739b16fc))
* Add FileSearch tool and associated FileSearchStore management APIs ([05cff8c](https://github.com/googleapis/js-genai/commit/05cff8ce01bb1579551f1f8d1fea95a6d2ae482a))
* Add FileSearch tool and associated FileSearchStore management APIs ([25aa2a4](https://github.com/googleapis/js-genai/commit/25aa2a40c4a3c859e9ac18335458260ed1210980))
* Add image_size to ImageConfig (Early Access Program) ([e1e883a](https://github.com/googleapis/js-genai/commit/e1e883aee308a1e5f166cd8981bc311a2057c616))
* Added phish filtering feature. ([4b75e5d](https://github.com/googleapis/js-genai/commit/4b75e5d142a11010ed21b967efb6cb74639c74c7))
* update the build configs ([97a2fac](https://github.com/googleapis/js-genai/commit/97a2faceea154754e95e29e2de9e5614056f406e))


### Bug Fixes

* disable AFC when there are AFC incompatible tool presented. ([30c63b4](https://github.com/googleapis/js-genai/commit/30c63b4b41e4fd75f18231a00774b9c13e9d423d))

## [1.28.0](https://github.com/googleapis/js-genai/compare/v1.27.0...v1.28.0) (2025-10-29)


### Features

* Add safety_filter_level and person_generation for Imagen upscaling ([aaceb1b](https://github.com/googleapis/js-genai/commit/aaceb1b78883db0ae08fb374c0f1ee4d960f1094))
* Add support for preference optimization tuning in the SDK. ([f74660e](https://github.com/googleapis/js-genai/commit/f74660e153964fea281f3d4b18f88460a5dac7b1))
* Pass file name to the backend when uploading with a file path ([7115726](https://github.com/googleapis/js-genai/commit/71157260ef1e92bffcd6e3250eb722b6931d7627))
* support default global location when not using api key with vertexai backend ([f8967b1](https://github.com/googleapis/js-genai/commit/f8967b1f353165b252e00407beebf2ca06831b76))
* Update `test-server-sdk` dependency to `^0.2.9`. ([8d507bf](https://github.com/googleapis/js-genai/commit/8d507bf42585dc0a6b1e1c47be61c024efd0a565))


### Bug Fixes

* Fix downloader. With this change after you await the download, the file write is complete, and the data is fully readable. ([127c9bf](https://github.com/googleapis/js-genai/commit/127c9bf29c0110a1292d5742c2bc87e4482eb6eb))

## [1.27.0](https://github.com/googleapis/js-genai/compare/v1.26.0...v1.27.0) (2025-10-23)


### Features

* Remove redundant calls to rollup/api-extractor, speeds up the TS SDK testing further by a factor of 2. ([009b75f](https://github.com/googleapis/js-genai/commit/009b75fd06129117cce480822efe9ffe9f13f853))


### Bug Fixes

* google auth ADC error ([f87611c](https://github.com/googleapis/js-genai/commit/f87611c70e0b1edcacd67f384fa14b4b2b37ac57))

## [1.26.0](https://github.com/googleapis/js-genai/compare/v1.25.0...v1.26.0) (2025-10-21)


### Features

* Add enable_enhanced_civic_answers in GenerationConfig ([0e95d72](https://github.com/googleapis/js-genai/commit/0e95d7244cccaeee3427a46d8843e9ba2fa38930))
* support jailbreak in HarmCategory and BlockedReason ([cd79a83](https://github.com/googleapis/js-genai/commit/cd79a83972a3c6a2e59e9b33004fb8e0e463eb9c))

## [1.25.0](https://github.com/googleapis/js-genai/compare/v1.24.0...v1.25.0) (2025-10-15)


### Features

* Support video extension for Veo on Gemini Developer API ([5d11d81](https://github.com/googleapis/js-genai/commit/5d11d810e2d8873be9197a3ae852f5b1df31e342))

## [1.24.0](https://github.com/googleapis/js-genai/compare/v1.23.0...v1.24.0) (2025-10-10)


### Features

* Enable Google Maps tool for Genai. ([b671fe9](https://github.com/googleapis/js-genai/commit/b671fe92f033b5ff47f2bd4c5353514e88b74b9b))
* Support enableWidget feature in GoogleMaps ([81ed6a3](https://github.com/googleapis/js-genai/commit/81ed6a3ba056493553794b0de0f276fb171e9a44))
* Support Gemini batch inline request's metadata and add test coverage to safety setting ([722562b](https://github.com/googleapis/js-genai/commit/722562b1c893f643d05d15c45ea1b81d2538f0ca))

## [1.23.0](https://github.com/googleapis/js-genai/compare/v1.22.0...v1.23.0) (2025-10-08)


### Features

* Add `NO_IMAGE` enum value to `FinishReason` ([5305334](https://github.com/googleapis/js-genai/commit/5305334d7c295b56bcfd0efe2bf8a1a7a5ba230a))
* Add labels field to Imagen configs ([1e9e96c](https://github.com/googleapis/js-genai/commit/1e9e96ca06520cde31a0506a7cf72bed635df45e))
* Add utility methods for creating `FunctionResponsePart` and creating FunctionResponse `Part` with `FunctionResponseParts` ([5a0ce38](https://github.com/googleapis/js-genai/commit/5a0ce383efbf09b3b9e4b14c720417879664c4a1))
* Enable Ingredients to Video and Advanced Controls for Veo on Gemini Developer API (Early Access Program) ([d5bd0c1](https://github.com/googleapis/js-genai/commit/d5bd0c1b8147711f604049069f433539544d4829))


### Bug Fixes

* support system_instruction and tools mapping via converter and cleanup handwritten mapping ([54ec204](https://github.com/googleapis/js-genai/commit/54ec204a1ff5f08ad619a78a5e13ad3708d50500))

## [1.22.0](https://github.com/googleapis/js-genai/compare/v1.21.0...v1.22.0) (2025-10-02)


### Features

* Add `ImageConfig` to `GenerateContentConfig` ([c137172](https://github.com/googleapis/js-genai/commit/c137172ddeb253341ce7aab5a1a84f172e63977a))
* Add thinking_config for live ([decc090](https://github.com/googleapis/js-genai/commit/decc090411c950c1fcc358ff0a04a2f67ae05100))
* rename ComputerUse tool (early access) ([e4345f9](https://github.com/googleapis/js-genai/commit/e4345f9175bcc729cd40d61905ad52ca6c3eba0d))

## [1.21.0](https://github.com/googleapis/js-genai/compare/v1.20.0...v1.21.0) (2025-09-25)


### Features

* Add FunctionResponsePart & ToolComputerUse.excludedPredefinedFunctions ([61620f6](https://github.com/googleapis/js-genai/commit/61620f64cc8ca6997e958bda6f61ed52faff71c8))
* Support Imagen 4 Ingredients on Vertex ([56cccfc](https://github.com/googleapis/js-genai/commit/56cccfca02b668ed3bfacc7e757eb821e827e35b))


### Bug Fixes

* [#963](https://github.com/googleapis/js-genai/issues/963) allow leading whitespace before data chunks ([24f4153](https://github.com/googleapis/js-genai/commit/24f4153ea652709e4093dd4f543c2fbebd693dc2))
* Expose `JOB_STATE_RUNNING` and `JOB_STATE_EXPIRED` for Gemini Batches states ([b513c69](https://github.com/googleapis/js-genai/commit/b513c69d2102b94733d2e436d8d1b8a47dd1bbf4))
* initialization of `pre_tuned_model_checkpoint_id` from tuning config. ([2e10e7f](https://github.com/googleapis/js-genai/commit/2e10e7f8d666fb8f0f332834266d9fd0a5d13c34))

## [1.20.0](https://github.com/googleapis/js-genai/compare/v1.19.0...v1.20.0) (2025-09-16)


### Features

* Add 'turn_complete_reason' and 'waiting_for_input' fields. ([cb54332](https://github.com/googleapis/js-genai/commit/cb543326e805cf1fc4f9167b1a8af797dc8a11ca))
* Add `VideoGenerationMaskMode` enum for Veo 2 Editing ([3e850fd](https://github.com/googleapis/js-genai/commit/3e850fdad8b5252608b8287b2e537fb9b0a2f35e))

## [1.19.0](https://github.com/googleapis/js-genai/compare/v1.18.0...v1.19.0) (2025-09-09)


### Features

* Add labels to create tuning job config ([220c4d6](https://github.com/googleapis/js-genai/commit/220c4d6c925d8ebfa3cfccff5ed964df1b775a62))
* Support Veo 2 Editing on Vertex ([6e34fd0](https://github.com/googleapis/js-genai/commit/6e34fd057cc88c300942f231f43e1c120f3a6fe6))


### Bug Fixes

* Enable `id` field in `FunctionCall` for Vertex AI. ([7c6e047](https://github.com/googleapis/js-genai/commit/7c6e047037103a0cc60c799a12dcc3ace3a5ba2f))

## [1.18.0](https://github.com/googleapis/js-genai/compare/v1.17.0...v1.18.0) (2025-09-09)


### Features

* generate the function_call class's converters ([e57a7bc](https://github.com/googleapis/js-genai/commit/e57a7bcc4e30e0f9ddef036bbe50680ebc476e83))
* Implement embed content batches. ([9cb8613](https://github.com/googleapis/js-genai/commit/9cb8613ef7646be0d6392f4da4da3eb6b0e6d5f6))

## [1.17.0](https://github.com/googleapis/js-genai/compare/v1.16.0...v1.17.0) (2025-09-02)


### Features

* Add resolution field for Gemini Developer API Veo 3 generation ([5ce467b](https://github.com/googleapis/js-genai/commit/5ce467b754b82f1a2ba18e75f27962c0764db091))

## [1.16.0](https://github.com/googleapis/js-genai/compare/v1.15.0...v1.16.0) (2025-08-27)


### Features

* add `sdkHttpResponse.headers` to *Delete responses. ([397c602](https://github.com/googleapis/js-genai/commit/397c6022864adfd5113da58977ee036d186e81a2))
* Add add_watermark field for recontext_image (Virtual Try-On, Product Recontext) ([e182fe8](https://github.com/googleapis/js-genai/commit/e182fe89deebf2c0bbe0310c689e444a56351896))
* Add output_gcs_uri to Imagen upscale_image ([8db102a](https://github.com/googleapis/js-genai/commit/8db102a976c6dadcf6596bdd2b378f982da1261b))
* add outputSchema support for MCP ([e2d4e50](https://github.com/googleapis/js-genai/commit/e2d4e507513009ba1bff79f193459772673ac42d))
* Add VALIDATED mode into FunctionCallingConfigMode ([af410e7](https://github.com/googleapis/js-genai/commit/af410e74f540411e809725f809caab40a624ba6f))
* Add VideoGenerationReferenceType enum for generate_videos ([eb17013](https://github.com/googleapis/js-genai/commit/eb170130c2c81b7f149f1d824b813fb3c44db36d))
* Support GenerateVideosSource for Veo GenerateVideos ([2241749](https://github.com/googleapis/js-genai/commit/2241749382f760eb942bf84318f64b2e9c535694))
* support tunings.cancel in the genai SDK for Python, Java, JS, and Go ([2d67d25](https://github.com/googleapis/js-genai/commit/2d67d25d4b7cbdeb6b04caf15cb6b8b3b1033e68))
* Update server test recordings to JSON. ([dd0a033](https://github.com/googleapis/js-genai/commit/dd0a0334375f373964acf9c7d6b4d2b8905226a1))


### Bug Fixes

* **js:** empty env vars should be treated as undefined. ([16a80c0](https://github.com/googleapis/js-genai/commit/16a80c04f0b8353a6c4e64a7d29c171e0c241ae3))

## [1.15.0](https://github.com/googleapis/js-genai/compare/v1.14.0...v1.15.0) (2025-08-18)


### Features

* Support Imagen image segmentation on Vertex ([6b86bae](https://github.com/googleapis/js-genai/commit/6b86baecc425197c2db1b734e93a4a5dcb9a10a4))
* Support Veo 2 Reference Images to Video Generation on Vertex ([6bca6ad](https://github.com/googleapis/js-genai/commit/6bca6ad37edd4ebda024b2eaf617d4ad213a791f))


### Bug Fixes

* **chats:** Drop the validation on part with empty text ([d2602d2](https://github.com/googleapis/js-genai/commit/d2602d2ec47402d567f095c6c621b258432ff896))
* Fix the bug to support Gemini Batch inlined requests system instruction ([843c774](https://github.com/googleapis/js-genai/commit/843c7746edc9497499b8af277f4f3901f31dce9a))

## [1.14.0](https://github.com/googleapis/js-genai/compare/v1.13.0...v1.14.0) (2025-08-13)


### Features

* add an _exclude_fields characteristic in the config for unused values to avoid unnecessary and unused code in converter and type generation. ([15a4504](https://github.com/googleapis/js-genai/commit/15a4504ac3455044bb3ef51440ccbf420168104e))
* enable continuous fine-tuning on a pre-tuned model in the SDK. ([027f09d](https://github.com/googleapis/js-genai/commit/027f09db662ce6b30f737b10b4d2efcb4282a9b6))
* support document name in grounding metadata ([b801236](https://github.com/googleapis/js-genai/commit/b8012365f7ec7917576ca048bbaa37ac9d011795))
* Support exclude_domains in Google Search and Enterprise Web Search ([8ed49f1](https://github.com/googleapis/js-genai/commit/8ed49f171e2a1bf2cfb187869e4682ed2f8bd2fb))


### Bug Fixes

* Replace `gemini-2.5-flash-preview-04-17` with `gemini-2.5-flash`. ([d7f1c30](https://github.com/googleapis/js-genai/commit/d7f1c304554c045cdd8bf710d11178a1d07b2983))

## [1.13.0](https://github.com/googleapis/js-genai/compare/v1.12.0...v1.13.0) (2025-08-06)


### Features

* Add image_size field for Gemini Developer API Imagen 4 generation ([9841ecb](https://github.com/googleapis/js-genai/commit/9841ecb359d57648e284271fdf3a477ca3c5d6f1))
* Add Lyria enum for music generation mode for vocalization ([b05821f](https://github.com/googleapis/js-genai/commit/b05821f5279ba0a579312fb66deafc79bf56fda5))
* allow methods in batch to return headers in sdk_http_response by default ([55a2be4](https://github.com/googleapis/js-genai/commit/55a2be418f132788e5be6266c05ba42bf96c4aa1))
* enable responseId for Gemini Developer API ([40e3a58](https://github.com/googleapis/js-genai/commit/40e3a58e31d09f77eb600c4e472965646ad7dd63))
* Support image recontext on Vertex ([e417867](https://github.com/googleapis/js-genai/commit/e417867f181ca3a577ed6089233d18110b5a6558))
* Support new enum types for UrlRetrievalStatus ([88b47e6](https://github.com/googleapis/js-genai/commit/88b47e6f4bebea188bf7baec437a948e16d703bb))

## [1.12.0](https://github.com/googleapis/js-genai/compare/v1.11.0...v1.12.0) (2025-07-30)


### Features

* allow methods in models to return headers in sdk_http_response by default. ([efdcb8a](https://github.com/googleapis/js-genai/commit/efdcb8a844155127cc58b05cfcb3f4f676613c1a))
* allow methods in tuning to return headers in sdk_http_response by default ([f81c16a](https://github.com/googleapis/js-genai/commit/f81c16a4723c0696e100c5926fe5416263621b8b))


### Bug Fixes

* Correctly populated the Rai filter reasons on Video Generation ([316cdb0](https://github.com/googleapis/js-genai/commit/316cdb05d0bf87a03e463812e48f7c0c8fe5296a))

## [1.11.0](https://github.com/googleapis/js-genai/compare/v1.10.0...v1.11.0) (2025-07-23)


### Features

* Add image_size field for Vertex Imagen 4 generation ([b6cc23e](https://github.com/googleapis/js-genai/commit/b6cc23ee90b576db1529f33ff5c209742baedab8))
* enable function calling for Callable Tool besides McpClient in generateContent. ([90565bd](https://github.com/googleapis/js-genai/commit/90565bda219f4a72bbbe72497c72c34f6ead83b5))
* Introduced Operations.get() which is a generic function to handle all Operation types. ([a6f85c1](https://github.com/googleapis/js-genai/commit/a6f85c1d5848f03b63b7038a0af6567caca295cf))
* return headers for list method in all modules. ([e8591a3](https://github.com/googleapis/js-genai/commit/e8591a3adf024e4667f55610d2069edb52be8f8d))
* Updates to codegen instructions to improve performance for TypeScript ([9c97ec6](https://github.com/googleapis/js-genai/commit/9c97ec645a7ab1e3a2e28319dac54a640e0eda57))

## [1.10.0](https://github.com/googleapis/js-genai/compare/v1.9.0...v1.10.0) (2025-07-17)


### Features

* Add `addWatermark` parameter to the edit image configuration. ([16bca99](https://github.com/googleapis/js-genai/commit/16bca999fe432eabd69c78988e2e6e4bc099342d))
* Adding codegen instructions to guide LLMs to generate code with the Google GenAI SDK ([7f74175](https://github.com/googleapis/js-genai/commit/7f741751ba7a7a15e29469c6debf25b6605252ed))
* Update `hasMcpToolUsage` to set the MCP tool usage when it is detected by calling `mcpToTool` ([a70f9c4](https://github.com/googleapis/js-genai/commit/a70f9c4d76d6b6d05f831fedeb1bc166f5226ef1))


### Bug Fixes

* **live:** enhance security by moving api key from query parameters to header ([f183b7d](https://github.com/googleapis/js-genai/commit/f183b7d7fa33f4f66bef4b7d49ab0c4848cca2e4))
* **live:** Rollback commit f183b7d, breaks live in web env ([be24e86](https://github.com/googleapis/js-genai/commit/be24e86e572c35d5b39313a9b154a04f7717340f))

## [1.9.0](https://github.com/googleapis/js-genai/compare/v1.8.0...v1.9.0) (2025-07-09)


### Features

* Add new languages for Imagen 4 prompt language ([65be769](https://github.com/googleapis/js-genai/commit/65be7692d02e83708348980b7c771f673d744f84))


### Bug Fixes

* add unref() for request timeouts ([6b76c4b](https://github.com/googleapis/js-genai/commit/6b76c4b5850b28f246d11ff99bb556e9e3318ee6))

## [1.8.0](https://github.com/googleapis/js-genai/compare/v1.7.0...v1.8.0) (2025-07-01)


### Features

* Enable Vertex Multimodal Dataset as input to supervised fine-tuning. ([055b435](https://github.com/googleapis/js-genai/commit/055b435ab57f6beb46fc0d0da757b4a24ff05e2d))
* Support Batches delete ([6cd9174](https://github.com/googleapis/js-genai/commit/6cd917424ea783023f6b4197bb35554481539dba))
* Support different media input in Vertex Live API ([305952e](https://github.com/googleapis/js-genai/commit/305952e3bd62729248e80a57bbaac0a9254a14ee))

## [1.7.0](https://github.com/googleapis/js-genai/compare/v1.6.0...v1.7.0) (2025-06-25)


### Features

* Add compressionQuality enum for generate_videos ([4325773](https://github.com/googleapis/js-genai/commit/432577312dedb474e6892963f83edba830d9ed6d))
* Add enhance_input_image and image_preservation_factor fields for upscale_image ([13eedda](https://github.com/googleapis/js-genai/commit/13eedda4c7ba0b190481e5e7f43995542702ee25))
* Batches support in TS ([dd7355e](https://github.com/googleapis/js-genai/commit/dd7355efdfec4a7323c204b8bad6e6b07d897557))
* expose the responseJsonSchema in GenerateContentConfig ([db54a5f](https://github.com/googleapis/js-genai/commit/db54a5f0f3cfa1f4ec300c2ea115eaf239a01639))


### Bug Fixes

* **live:** support ArrayBuffer in WebSocket messages ([5a8aeac](https://github.com/googleapis/js-genai/commit/5a8aeac1ce69e098b12f50b1299dab19ef0bd23a)), closes [#714](https://github.com/googleapis/js-genai/issues/714)

## [1.6.0](https://github.com/googleapis/js-genai/compare/v1.5.1...v1.6.0) (2025-06-21)


### Features

* allow users to access headers for generateContent method and generateContentStream ([f5f0e02](https://github.com/googleapis/js-genai/commit/f5f0e023805ca75be348b38ad6a9382d5707f97a))
* enable json schema for controlled output and function declaration. ([7d53d57](https://github.com/googleapis/js-genai/commit/7d53d578ea8b6fa7a418312357a8a593d3c0122a))
* Include status code and export HTTP errors ([bcabcb6](https://github.com/googleapis/js-genai/commit/bcabcb6fa2975ff8b0afbbf108748def39f1e9aa))
* support extra_body in HttpOptions ([1d48b6e](https://github.com/googleapis/js-genai/commit/1d48b6eafaee0d39ea72f7bfc396e45ada6c69ae))


### Bug Fixes

* Fix build errors when the mcp package is not installed. ([5b7e695](https://github.com/googleapis/js-genai/commit/5b7e695552b6d5cd1e55056bbe6bc9349a479e18))

## [1.5.1](https://github.com/googleapis/js-genai/compare/v1.5.0...v1.5.1) (2025-06-13)


### Bug Fixes

* Update MCP dependencies to be type-only ([648019b](https://github.com/googleapis/js-genai/commit/648019bebb5cff3e8b3bb6db72534934bd7c1357))

## [1.5.0](https://github.com/googleapis/js-genai/compare/v1.4.0...v1.5.0) (2025-06-11)


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
