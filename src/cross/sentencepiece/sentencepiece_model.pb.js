/*eslint-disable block-scoped-var, id-length, no-control-regex,
 * no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var,
 * sort-vars*/

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import $protobuf from 'protobufjs/minimal.js';

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer,
      $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots['default'] || ($protobuf.roots['default'] = {});

export const sentencepiece = $root.sentencepiece = (() => {
  /**
   * Namespace sentencepiece.
   * @exports sentencepiece
   * @namespace
   */
  const sentencepiece = {};

  sentencepiece.TrainerSpec = (function() {
    /**
     * Properties of a TrainerSpec.
     * @memberof sentencepiece
     * @interface ITrainerSpec
     * @property {Array.<string>|null} [input] TrainerSpec input
     * @property {string|null} [inputFormat] TrainerSpec inputFormat
     * @property {string|null} [modelPrefix] TrainerSpec modelPrefix
     * @property {sentencepiece.TrainerSpec.ModelType|null} [modelType]
     * TrainerSpec modelType
     * @property {number|null} [vocabSize] TrainerSpec vocabSize
     * @property {Array.<string>|null} [acceptLanguage] TrainerSpec
     * acceptLanguage
     * @property {number|null} [selfTestSampleSize] TrainerSpec
     * selfTestSampleSize
     * @property {boolean|null} [enableDifferentialPrivacy] TrainerSpec
     * enableDifferentialPrivacy
     * @property {number|null} [differentialPrivacyNoiseLevel] TrainerSpec
     * differentialPrivacyNoiseLevel
     * @property {number|Long|null} [differentialPrivacyClippingThreshold]
     * TrainerSpec differentialPrivacyClippingThreshold
     * @property {number|null} [characterCoverage] TrainerSpec characterCoverage
     * @property {number|Long|null} [inputSentenceSize] TrainerSpec
     * inputSentenceSize
     * @property {boolean|null} [shuffleInputSentence] TrainerSpec
     * shuffleInputSentence
     * @property {number|null} [miningSentenceSize] TrainerSpec
     * miningSentenceSize
     * @property {number|null} [trainingSentenceSize] TrainerSpec
     * trainingSentenceSize
     * @property {number|null} [seedSentencepieceSize] TrainerSpec
     * seedSentencepieceSize
     * @property {number|null} [shrinkingFactor] TrainerSpec shrinkingFactor
     * @property {number|null} [maxSentenceLength] TrainerSpec maxSentenceLength
     * @property {number|null} [numThreads] TrainerSpec numThreads
     * @property {number|null} [numSubIterations] TrainerSpec numSubIterations
     * @property {number|null} [maxSentencepieceLength] TrainerSpec
     * maxSentencepieceLength
     * @property {boolean|null} [splitByUnicodeScript] TrainerSpec
     * splitByUnicodeScript
     * @property {boolean|null} [splitByNumber] TrainerSpec splitByNumber
     * @property {boolean|null} [splitByWhitespace] TrainerSpec
     * splitByWhitespace
     * @property {boolean|null} [treatWhitespaceAsSuffix] TrainerSpec
     * treatWhitespaceAsSuffix
     * @property {boolean|null} [allowWhitespaceOnlyPieces] TrainerSpec
     * allowWhitespaceOnlyPieces
     * @property {boolean|null} [splitDigits] TrainerSpec splitDigits
     * @property {string|null} [pretokenizationDelimiter] TrainerSpec
     * pretokenizationDelimiter
     * @property {Array.<string>|null} [controlSymbols] TrainerSpec
     * controlSymbols
     * @property {Array.<string>|null} [userDefinedSymbols] TrainerSpec
     * userDefinedSymbols
     * @property {string|null} [requiredChars] TrainerSpec requiredChars
     * @property {boolean|null} [byteFallback] TrainerSpec byteFallback
     * @property {boolean|null} [vocabularyOutputPieceScore] TrainerSpec
     * vocabularyOutputPieceScore
     * @property {boolean|null} [hardVocabLimit] TrainerSpec hardVocabLimit
     * @property {boolean|null} [useAllVocab] TrainerSpec useAllVocab
     * @property {number|null} [unkId] TrainerSpec unkId
     * @property {number|null} [bosId] TrainerSpec bosId
     * @property {number|null} [eosId] TrainerSpec eosId
     * @property {number|null} [padId] TrainerSpec padId
     * @property {string|null} [unkPiece] TrainerSpec unkPiece
     * @property {string|null} [bosPiece] TrainerSpec bosPiece
     * @property {string|null} [eosPiece] TrainerSpec eosPiece
     * @property {string|null} [padPiece] TrainerSpec padPiece
     * @property {string|null} [unkSurface] TrainerSpec unkSurface
     * @property {boolean|null} [trainExtremelyLargeCorpus] TrainerSpec
     * trainExtremelyLargeCorpus
     * @property {string|null} [seedSentencepiecesFile] TrainerSpec
     * seedSentencepiecesFile
     */

    /**
     * Constructs a new TrainerSpec.
     * @memberof sentencepiece
     * @classdesc Represents a TrainerSpec.
     * @implements ITrainerSpec
     * @constructor
     * @param {sentencepiece.ITrainerSpec=} [properties] Properties to set
     */
    function TrainerSpec(properties) {
      this.input = [];
      this.acceptLanguage = [];
      this.controlSymbols = [];
      this.userDefinedSymbols = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TrainerSpec input.
     * @member {Array.<string>} input
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.input = $util.emptyArray;

    /**
     * TrainerSpec inputFormat.
     * @member {string} inputFormat
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.inputFormat = '';

    /**
     * TrainerSpec modelPrefix.
     * @member {string} modelPrefix
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.modelPrefix = '';

    /**
     * TrainerSpec modelType.
     * @member {sentencepiece.TrainerSpec.ModelType} modelType
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.modelType = 1;

    /**
     * TrainerSpec vocabSize.
     * @member {number} vocabSize
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.vocabSize = 8000;

    /**
     * TrainerSpec acceptLanguage.
     * @member {Array.<string>} acceptLanguage
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.acceptLanguage = $util.emptyArray;

    /**
     * TrainerSpec selfTestSampleSize.
     * @member {number} selfTestSampleSize
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.selfTestSampleSize = 0;

    /**
     * TrainerSpec enableDifferentialPrivacy.
     * @member {boolean} enableDifferentialPrivacy
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.enableDifferentialPrivacy = false;

    /**
     * TrainerSpec differentialPrivacyNoiseLevel.
     * @member {number} differentialPrivacyNoiseLevel
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.differentialPrivacyNoiseLevel = 0;

    /**
     * TrainerSpec differentialPrivacyClippingThreshold.
     * @member {number|Long} differentialPrivacyClippingThreshold
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.differentialPrivacyClippingThreshold =
        $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * TrainerSpec characterCoverage.
     * @member {number} characterCoverage
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.characterCoverage = 0.9995;

    /**
     * TrainerSpec inputSentenceSize.
     * @member {number|Long} inputSentenceSize
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.inputSentenceSize =
        $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * TrainerSpec shuffleInputSentence.
     * @member {boolean} shuffleInputSentence
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.shuffleInputSentence = true;

    /**
     * TrainerSpec miningSentenceSize.
     * @member {number} miningSentenceSize
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.miningSentenceSize = 0;

    /**
     * TrainerSpec trainingSentenceSize.
     * @member {number} trainingSentenceSize
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.trainingSentenceSize = 0;

    /**
     * TrainerSpec seedSentencepieceSize.
     * @member {number} seedSentencepieceSize
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.seedSentencepieceSize = 1000000;

    /**
     * TrainerSpec shrinkingFactor.
     * @member {number} shrinkingFactor
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.shrinkingFactor = 0.75;

    /**
     * TrainerSpec maxSentenceLength.
     * @member {number} maxSentenceLength
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.maxSentenceLength = 4192;

    /**
     * TrainerSpec numThreads.
     * @member {number} numThreads
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.numThreads = 16;

    /**
     * TrainerSpec numSubIterations.
     * @member {number} numSubIterations
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.numSubIterations = 2;

    /**
     * TrainerSpec maxSentencepieceLength.
     * @member {number} maxSentencepieceLength
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.maxSentencepieceLength = 16;

    /**
     * TrainerSpec splitByUnicodeScript.
     * @member {boolean} splitByUnicodeScript
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.splitByUnicodeScript = true;

    /**
     * TrainerSpec splitByNumber.
     * @member {boolean} splitByNumber
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.splitByNumber = true;

    /**
     * TrainerSpec splitByWhitespace.
     * @member {boolean} splitByWhitespace
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.splitByWhitespace = true;

    /**
     * TrainerSpec treatWhitespaceAsSuffix.
     * @member {boolean} treatWhitespaceAsSuffix
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.treatWhitespaceAsSuffix = false;

    /**
     * TrainerSpec allowWhitespaceOnlyPieces.
     * @member {boolean} allowWhitespaceOnlyPieces
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.allowWhitespaceOnlyPieces = false;

    /**
     * TrainerSpec splitDigits.
     * @member {boolean} splitDigits
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.splitDigits = false;

    /**
     * TrainerSpec pretokenizationDelimiter.
     * @member {string} pretokenizationDelimiter
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.pretokenizationDelimiter = '';

    /**
     * TrainerSpec controlSymbols.
     * @member {Array.<string>} controlSymbols
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.controlSymbols = $util.emptyArray;

    /**
     * TrainerSpec userDefinedSymbols.
     * @member {Array.<string>} userDefinedSymbols
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.userDefinedSymbols = $util.emptyArray;

    /**
     * TrainerSpec requiredChars.
     * @member {string} requiredChars
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.requiredChars = '';

    /**
     * TrainerSpec byteFallback.
     * @member {boolean} byteFallback
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.byteFallback = false;

    /**
     * TrainerSpec vocabularyOutputPieceScore.
     * @member {boolean} vocabularyOutputPieceScore
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.vocabularyOutputPieceScore = true;

    /**
     * TrainerSpec hardVocabLimit.
     * @member {boolean} hardVocabLimit
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.hardVocabLimit = true;

    /**
     * TrainerSpec useAllVocab.
     * @member {boolean} useAllVocab
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.useAllVocab = false;

    /**
     * TrainerSpec unkId.
     * @member {number} unkId
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.unkId = 0;

    /**
     * TrainerSpec bosId.
     * @member {number} bosId
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.bosId = 1;

    /**
     * TrainerSpec eosId.
     * @member {number} eosId
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.eosId = 2;

    /**
     * TrainerSpec padId.
     * @member {number} padId
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.padId = -1;

    /**
     * TrainerSpec unkPiece.
     * @member {string} unkPiece
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.unkPiece = '<unk>';

    /**
     * TrainerSpec bosPiece.
     * @member {string} bosPiece
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.bosPiece = '<s>';

    /**
     * TrainerSpec eosPiece.
     * @member {string} eosPiece
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.eosPiece = '</s>';

    /**
     * TrainerSpec padPiece.
     * @member {string} padPiece
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.padPiece = '<pad>';

    /**
     * TrainerSpec unkSurface.
     * @member {string} unkSurface
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.unkSurface = ' E28187 ';

    /**
     * TrainerSpec trainExtremelyLargeCorpus.
     * @member {boolean} trainExtremelyLargeCorpus
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.trainExtremelyLargeCorpus = false;

    /**
     * TrainerSpec seedSentencepiecesFile.
     * @member {string} seedSentencepiecesFile
     * @memberof sentencepiece.TrainerSpec
     * @instance
     */
    TrainerSpec.prototype.seedSentencepiecesFile = '';

    /**
     * Creates a new TrainerSpec instance using the specified properties.
     * @function create
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {sentencepiece.ITrainerSpec=} [properties] Properties to set
     * @returns {sentencepiece.TrainerSpec} TrainerSpec instance
     */
    TrainerSpec.create = function create(properties) {
      return new TrainerSpec(properties);
    };

    /**
     * Encodes the specified TrainerSpec message. Does not implicitly {@link
     * sentencepiece.TrainerSpec.verify|verify} messages.
     * @function encode
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {sentencepiece.ITrainerSpec} message TrainerSpec message or plain
     *     object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TrainerSpec.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.input != null && message.input.length)
        for (let i = 0; i < message.input.length; ++i)
          writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.input[i]);
      if (message.modelPrefix != null &&
          Object.hasOwnProperty.call(message, 'modelPrefix'))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.modelPrefix);
      if (message.modelType != null &&
          Object.hasOwnProperty.call(message, 'modelType'))
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.modelType);
      if (message.vocabSize != null &&
          Object.hasOwnProperty.call(message, 'vocabSize'))
        writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.vocabSize);
      if (message.acceptLanguage != null && message.acceptLanguage.length)
        for (let i = 0; i < message.acceptLanguage.length; ++i)
          writer.uint32(/* id 5, wireType 2 =*/ 42)
              .string(message.acceptLanguage[i]);
      if (message.selfTestSampleSize != null &&
          Object.hasOwnProperty.call(message, 'selfTestSampleSize'))
        writer.uint32(/* id 6, wireType 0 =*/ 48)
            .int32(message.selfTestSampleSize);
      if (message.inputFormat != null &&
          Object.hasOwnProperty.call(message, 'inputFormat'))
        writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.inputFormat);
      if (message.characterCoverage != null &&
          Object.hasOwnProperty.call(message, 'characterCoverage'))
        writer.uint32(/* id 10, wireType 5 =*/ 85)
            .float(message.characterCoverage);
      if (message.inputSentenceSize != null &&
          Object.hasOwnProperty.call(message, 'inputSentenceSize'))
        writer.uint32(/* id 11, wireType 0 =*/ 88)
            .uint64(message.inputSentenceSize);
      if (message.miningSentenceSize != null &&
          Object.hasOwnProperty.call(message, 'miningSentenceSize'))
        writer.uint32(/* id 12, wireType 0 =*/ 96)
            .int32(message.miningSentenceSize);
      if (message.trainingSentenceSize != null &&
          Object.hasOwnProperty.call(message, 'trainingSentenceSize'))
        writer.uint32(/* id 13, wireType 0 =*/ 104)
            .int32(message.trainingSentenceSize);
      if (message.seedSentencepieceSize != null &&
          Object.hasOwnProperty.call(message, 'seedSentencepieceSize'))
        writer.uint32(/* id 14, wireType 0 =*/ 112)
            .int32(message.seedSentencepieceSize);
      if (message.shrinkingFactor != null &&
          Object.hasOwnProperty.call(message, 'shrinkingFactor'))
        writer.uint32(/* id 15, wireType 5 =*/ 125)
            .float(message.shrinkingFactor);
      if (message.numThreads != null &&
          Object.hasOwnProperty.call(message, 'numThreads'))
        writer.uint32(/* id 16, wireType 0 =*/ 128).int32(message.numThreads);
      if (message.numSubIterations != null &&
          Object.hasOwnProperty.call(message, 'numSubIterations'))
        writer.uint32(/* id 17, wireType 0 =*/ 136)
            .int32(message.numSubIterations);
      if (message.maxSentenceLength != null &&
          Object.hasOwnProperty.call(message, 'maxSentenceLength'))
        writer.uint32(/* id 18, wireType 0 =*/ 144)
            .int32(message.maxSentenceLength);
      if (message.shuffleInputSentence != null &&
          Object.hasOwnProperty.call(message, 'shuffleInputSentence'))
        writer.uint32(/* id 19, wireType 0 =*/ 152)
            .bool(message.shuffleInputSentence);
      if (message.maxSentencepieceLength != null &&
          Object.hasOwnProperty.call(message, 'maxSentencepieceLength'))
        writer.uint32(/* id 20, wireType 0 =*/ 160)
            .int32(message.maxSentencepieceLength);
      if (message.splitByUnicodeScript != null &&
          Object.hasOwnProperty.call(message, 'splitByUnicodeScript'))
        writer.uint32(/* id 21, wireType 0 =*/ 168)
            .bool(message.splitByUnicodeScript);
      if (message.splitByWhitespace != null &&
          Object.hasOwnProperty.call(message, 'splitByWhitespace'))
        writer.uint32(/* id 22, wireType 0 =*/ 176)
            .bool(message.splitByWhitespace);
      if (message.splitByNumber != null &&
          Object.hasOwnProperty.call(message, 'splitByNumber'))
        writer.uint32(/* id 23, wireType 0 =*/ 184).bool(message.splitByNumber);
      if (message.treatWhitespaceAsSuffix != null &&
          Object.hasOwnProperty.call(message, 'treatWhitespaceAsSuffix'))
        writer.uint32(/* id 24, wireType 0 =*/ 192)
            .bool(message.treatWhitespaceAsSuffix);
      if (message.splitDigits != null &&
          Object.hasOwnProperty.call(message, 'splitDigits'))
        writer.uint32(/* id 25, wireType 0 =*/ 200).bool(message.splitDigits);
      if (message.allowWhitespaceOnlyPieces != null &&
          Object.hasOwnProperty.call(message, 'allowWhitespaceOnlyPieces'))
        writer.uint32(/* id 26, wireType 0 =*/ 208)
            .bool(message.allowWhitespaceOnlyPieces);
      if (message.controlSymbols != null && message.controlSymbols.length)
        for (let i = 0; i < message.controlSymbols.length; ++i)
          writer.uint32(/* id 30, wireType 2 =*/ 242)
              .string(message.controlSymbols[i]);
      if (message.userDefinedSymbols != null &&
          message.userDefinedSymbols.length)
        for (let i = 0; i < message.userDefinedSymbols.length; ++i)
          writer.uint32(/* id 31, wireType 2 =*/ 250)
              .string(message.userDefinedSymbols[i]);
      if (message.vocabularyOutputPieceScore != null &&
          Object.hasOwnProperty.call(message, 'vocabularyOutputPieceScore'))
        writer.uint32(/* id 32, wireType 0 =*/ 256)
            .bool(message.vocabularyOutputPieceScore);
      if (message.hardVocabLimit != null &&
          Object.hasOwnProperty.call(message, 'hardVocabLimit'))
        writer.uint32(/* id 33, wireType 0 =*/ 264)
            .bool(message.hardVocabLimit);
      if (message.useAllVocab != null &&
          Object.hasOwnProperty.call(message, 'useAllVocab'))
        writer.uint32(/* id 34, wireType 0 =*/ 272).bool(message.useAllVocab);
      if (message.byteFallback != null &&
          Object.hasOwnProperty.call(message, 'byteFallback'))
        writer.uint32(/* id 35, wireType 0 =*/ 280).bool(message.byteFallback);
      if (message.requiredChars != null &&
          Object.hasOwnProperty.call(message, 'requiredChars'))
        writer.uint32(/* id 36, wireType 2 =*/ 290)
            .string(message.requiredChars);
      if (message.unkId != null && Object.hasOwnProperty.call(message, 'unkId'))
        writer.uint32(/* id 40, wireType 0 =*/ 320).int32(message.unkId);
      if (message.bosId != null && Object.hasOwnProperty.call(message, 'bosId'))
        writer.uint32(/* id 41, wireType 0 =*/ 328).int32(message.bosId);
      if (message.eosId != null && Object.hasOwnProperty.call(message, 'eosId'))
        writer.uint32(/* id 42, wireType 0 =*/ 336).int32(message.eosId);
      if (message.padId != null && Object.hasOwnProperty.call(message, 'padId'))
        writer.uint32(/* id 43, wireType 0 =*/ 344).int32(message.padId);
      if (message.unkSurface != null &&
          Object.hasOwnProperty.call(message, 'unkSurface'))
        writer.uint32(/* id 44, wireType 2 =*/ 354).string(message.unkSurface);
      if (message.unkPiece != null &&
          Object.hasOwnProperty.call(message, 'unkPiece'))
        writer.uint32(/* id 45, wireType 2 =*/ 362).string(message.unkPiece);
      if (message.bosPiece != null &&
          Object.hasOwnProperty.call(message, 'bosPiece'))
        writer.uint32(/* id 46, wireType 2 =*/ 370).string(message.bosPiece);
      if (message.eosPiece != null &&
          Object.hasOwnProperty.call(message, 'eosPiece'))
        writer.uint32(/* id 47, wireType 2 =*/ 378).string(message.eosPiece);
      if (message.padPiece != null &&
          Object.hasOwnProperty.call(message, 'padPiece'))
        writer.uint32(/* id 48, wireType 2 =*/ 386).string(message.padPiece);
      if (message.trainExtremelyLargeCorpus != null &&
          Object.hasOwnProperty.call(message, 'trainExtremelyLargeCorpus'))
        writer.uint32(/* id 49, wireType 0 =*/ 392)
            .bool(message.trainExtremelyLargeCorpus);
      if (message.enableDifferentialPrivacy != null &&
          Object.hasOwnProperty.call(message, 'enableDifferentialPrivacy'))
        writer.uint32(/* id 50, wireType 0 =*/ 400)
            .bool(message.enableDifferentialPrivacy);
      if (message.differentialPrivacyNoiseLevel != null &&
          Object.hasOwnProperty.call(message, 'differentialPrivacyNoiseLevel'))
        writer.uint32(/* id 51, wireType 5 =*/ 413)
            .float(message.differentialPrivacyNoiseLevel);
      if (message.differentialPrivacyClippingThreshold != null &&
          Object.hasOwnProperty.call(
              message, 'differentialPrivacyClippingThreshold'))
        writer.uint32(/* id 52, wireType 0 =*/ 416)
            .uint64(message.differentialPrivacyClippingThreshold);
      if (message.pretokenizationDelimiter != null &&
          Object.hasOwnProperty.call(message, 'pretokenizationDelimiter'))
        writer.uint32(/* id 53, wireType 2 =*/ 426)
            .string(message.pretokenizationDelimiter);
      if (message.seedSentencepiecesFile != null &&
          Object.hasOwnProperty.call(message, 'seedSentencepiecesFile'))
        writer.uint32(/* id 54, wireType 2 =*/ 434)
            .string(message.seedSentencepiecesFile);
      return writer;
    };

    /**
     * Encodes the specified TrainerSpec message, length delimited. Does not
     * implicitly {@link sentencepiece.TrainerSpec.verify|verify} messages.
     * @function encodeDelimited
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {sentencepiece.ITrainerSpec} message TrainerSpec message or plain
     *     object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TrainerSpec.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TrainerSpec message from the specified reader or buffer.
     * @function decode
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
     *     from
     * @param {number} [length] Message length if known beforehand
     * @returns {sentencepiece.TrainerSpec} TrainerSpec
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TrainerSpec.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.sentencepiece.TrainerSpec();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (!(message.input && message.input.length)) message.input = [];
            message.input.push(reader.string());
            break;
          }
          case 7: {
            message.inputFormat = reader.string();
            break;
          }
          case 2: {
            message.modelPrefix = reader.string();
            break;
          }
          case 3: {
            message.modelType = reader.int32();
            break;
          }
          case 4: {
            message.vocabSize = reader.int32();
            break;
          }
          case 5: {
            if (!(message.acceptLanguage && message.acceptLanguage.length))
              message.acceptLanguage = [];
            message.acceptLanguage.push(reader.string());
            break;
          }
          case 6: {
            message.selfTestSampleSize = reader.int32();
            break;
          }
          case 50: {
            message.enableDifferentialPrivacy = reader.bool();
            break;
          }
          case 51: {
            message.differentialPrivacyNoiseLevel = reader.float();
            break;
          }
          case 52: {
            message.differentialPrivacyClippingThreshold = reader.uint64();
            break;
          }
          case 10: {
            message.characterCoverage = reader.float();
            break;
          }
          case 11: {
            message.inputSentenceSize = reader.uint64();
            break;
          }
          case 19: {
            message.shuffleInputSentence = reader.bool();
            break;
          }
          case 12: {
            message.miningSentenceSize = reader.int32();
            break;
          }
          case 13: {
            message.trainingSentenceSize = reader.int32();
            break;
          }
          case 14: {
            message.seedSentencepieceSize = reader.int32();
            break;
          }
          case 15: {
            message.shrinkingFactor = reader.float();
            break;
          }
          case 18: {
            message.maxSentenceLength = reader.int32();
            break;
          }
          case 16: {
            message.numThreads = reader.int32();
            break;
          }
          case 17: {
            message.numSubIterations = reader.int32();
            break;
          }
          case 20: {
            message.maxSentencepieceLength = reader.int32();
            break;
          }
          case 21: {
            message.splitByUnicodeScript = reader.bool();
            break;
          }
          case 23: {
            message.splitByNumber = reader.bool();
            break;
          }
          case 22: {
            message.splitByWhitespace = reader.bool();
            break;
          }
          case 24: {
            message.treatWhitespaceAsSuffix = reader.bool();
            break;
          }
          case 26: {
            message.allowWhitespaceOnlyPieces = reader.bool();
            break;
          }
          case 25: {
            message.splitDigits = reader.bool();
            break;
          }
          case 53: {
            message.pretokenizationDelimiter = reader.string();
            break;
          }
          case 30: {
            if (!(message.controlSymbols && message.controlSymbols.length))
              message.controlSymbols = [];
            message.controlSymbols.push(reader.string());
            break;
          }
          case 31: {
            if (!(message.userDefinedSymbols &&
                  message.userDefinedSymbols.length))
              message.userDefinedSymbols = [];
            message.userDefinedSymbols.push(reader.string());
            break;
          }
          case 36: {
            message.requiredChars = reader.string();
            break;
          }
          case 35: {
            message.byteFallback = reader.bool();
            break;
          }
          case 32: {
            message.vocabularyOutputPieceScore = reader.bool();
            break;
          }
          case 33: {
            message.hardVocabLimit = reader.bool();
            break;
          }
          case 34: {
            message.useAllVocab = reader.bool();
            break;
          }
          case 40: {
            message.unkId = reader.int32();
            break;
          }
          case 41: {
            message.bosId = reader.int32();
            break;
          }
          case 42: {
            message.eosId = reader.int32();
            break;
          }
          case 43: {
            message.padId = reader.int32();
            break;
          }
          case 45: {
            message.unkPiece = reader.string();
            break;
          }
          case 46: {
            message.bosPiece = reader.string();
            break;
          }
          case 47: {
            message.eosPiece = reader.string();
            break;
          }
          case 48: {
            message.padPiece = reader.string();
            break;
          }
          case 44: {
            message.unkSurface = reader.string();
            break;
          }
          case 49: {
            message.trainExtremelyLargeCorpus = reader.bool();
            break;
          }
          case 54: {
            message.seedSentencepiecesFile = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TrainerSpec message from the specified reader or buffer, length
     * delimited.
     * @function decodeDelimited
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
     *     from
     * @returns {sentencepiece.TrainerSpec} TrainerSpec
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TrainerSpec.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TrainerSpec message.
     * @function verify
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is
     *     not
     */
    TrainerSpec.verify = function verify(message) {
      if (typeof message !== 'object' || message === null)
        return 'object expected';
      if (message.input != null && message.hasOwnProperty('input')) {
        if (!Array.isArray(message.input)) return 'input: array expected';
        for (let i = 0; i < message.input.length; ++i)
          if (!$util.isString(message.input[i]))
            return 'input: string[] expected';
      }
      if (message.inputFormat != null && message.hasOwnProperty('inputFormat'))
        if (!$util.isString(message.inputFormat))
          return 'inputFormat: string expected';
      if (message.modelPrefix != null && message.hasOwnProperty('modelPrefix'))
        if (!$util.isString(message.modelPrefix))
          return 'modelPrefix: string expected';
      if (message.modelType != null && message.hasOwnProperty('modelType'))
        switch (message.modelType) {
          default:
            return 'modelType: enum value expected';
          case 1:
          case 2:
          case 3:
          case 4:
            break;
        }
      if (message.vocabSize != null && message.hasOwnProperty('vocabSize'))
        if (!$util.isInteger(message.vocabSize))
          return 'vocabSize: integer expected';
      if (message.acceptLanguage != null &&
          message.hasOwnProperty('acceptLanguage')) {
        if (!Array.isArray(message.acceptLanguage))
          return 'acceptLanguage: array expected';
        for (let i = 0; i < message.acceptLanguage.length; ++i)
          if (!$util.isString(message.acceptLanguage[i]))
            return 'acceptLanguage: string[] expected';
      }
      if (message.selfTestSampleSize != null &&
          message.hasOwnProperty('selfTestSampleSize'))
        if (!$util.isInteger(message.selfTestSampleSize))
          return 'selfTestSampleSize: integer expected';
      if (message.enableDifferentialPrivacy != null &&
          message.hasOwnProperty('enableDifferentialPrivacy'))
        if (typeof message.enableDifferentialPrivacy !== 'boolean')
          return 'enableDifferentialPrivacy: boolean expected';
      if (message.differentialPrivacyNoiseLevel != null &&
          message.hasOwnProperty('differentialPrivacyNoiseLevel'))
        if (typeof message.differentialPrivacyNoiseLevel !== 'number')
          return 'differentialPrivacyNoiseLevel: number expected';
      if (message.differentialPrivacyClippingThreshold != null &&
          message.hasOwnProperty('differentialPrivacyClippingThreshold'))
        if (!$util.isInteger(message.differentialPrivacyClippingThreshold) &&
            !(message.differentialPrivacyClippingThreshold &&
              $util.isInteger(
                  message.differentialPrivacyClippingThreshold.low) &&
              $util.isInteger(
                  message.differentialPrivacyClippingThreshold.high)))
          return 'differentialPrivacyClippingThreshold: integer|Long expected';
      if (message.characterCoverage != null &&
          message.hasOwnProperty('characterCoverage'))
        if (typeof message.characterCoverage !== 'number')
          return 'characterCoverage: number expected';
      if (message.inputSentenceSize != null &&
          message.hasOwnProperty('inputSentenceSize'))
        if (!$util.isInteger(message.inputSentenceSize) &&
            !(message.inputSentenceSize &&
              $util.isInteger(message.inputSentenceSize.low) &&
              $util.isInteger(message.inputSentenceSize.high)))
          return 'inputSentenceSize: integer|Long expected';
      if (message.shuffleInputSentence != null &&
          message.hasOwnProperty('shuffleInputSentence'))
        if (typeof message.shuffleInputSentence !== 'boolean')
          return 'shuffleInputSentence: boolean expected';
      if (message.miningSentenceSize != null &&
          message.hasOwnProperty('miningSentenceSize'))
        if (!$util.isInteger(message.miningSentenceSize))
          return 'miningSentenceSize: integer expected';
      if (message.trainingSentenceSize != null &&
          message.hasOwnProperty('trainingSentenceSize'))
        if (!$util.isInteger(message.trainingSentenceSize))
          return 'trainingSentenceSize: integer expected';
      if (message.seedSentencepieceSize != null &&
          message.hasOwnProperty('seedSentencepieceSize'))
        if (!$util.isInteger(message.seedSentencepieceSize))
          return 'seedSentencepieceSize: integer expected';
      if (message.shrinkingFactor != null &&
          message.hasOwnProperty('shrinkingFactor'))
        if (typeof message.shrinkingFactor !== 'number')
          return 'shrinkingFactor: number expected';
      if (message.maxSentenceLength != null &&
          message.hasOwnProperty('maxSentenceLength'))
        if (!$util.isInteger(message.maxSentenceLength))
          return 'maxSentenceLength: integer expected';
      if (message.numThreads != null && message.hasOwnProperty('numThreads'))
        if (!$util.isInteger(message.numThreads))
          return 'numThreads: integer expected';
      if (message.numSubIterations != null &&
          message.hasOwnProperty('numSubIterations'))
        if (!$util.isInteger(message.numSubIterations))
          return 'numSubIterations: integer expected';
      if (message.maxSentencepieceLength != null &&
          message.hasOwnProperty('maxSentencepieceLength'))
        if (!$util.isInteger(message.maxSentencepieceLength))
          return 'maxSentencepieceLength: integer expected';
      if (message.splitByUnicodeScript != null &&
          message.hasOwnProperty('splitByUnicodeScript'))
        if (typeof message.splitByUnicodeScript !== 'boolean')
          return 'splitByUnicodeScript: boolean expected';
      if (message.splitByNumber != null &&
          message.hasOwnProperty('splitByNumber'))
        if (typeof message.splitByNumber !== 'boolean')
          return 'splitByNumber: boolean expected';
      if (message.splitByWhitespace != null &&
          message.hasOwnProperty('splitByWhitespace'))
        if (typeof message.splitByWhitespace !== 'boolean')
          return 'splitByWhitespace: boolean expected';
      if (message.treatWhitespaceAsSuffix != null &&
          message.hasOwnProperty('treatWhitespaceAsSuffix'))
        if (typeof message.treatWhitespaceAsSuffix !== 'boolean')
          return 'treatWhitespaceAsSuffix: boolean expected';
      if (message.allowWhitespaceOnlyPieces != null &&
          message.hasOwnProperty('allowWhitespaceOnlyPieces'))
        if (typeof message.allowWhitespaceOnlyPieces !== 'boolean')
          return 'allowWhitespaceOnlyPieces: boolean expected';
      if (message.splitDigits != null && message.hasOwnProperty('splitDigits'))
        if (typeof message.splitDigits !== 'boolean')
          return 'splitDigits: boolean expected';
      if (message.pretokenizationDelimiter != null &&
          message.hasOwnProperty('pretokenizationDelimiter'))
        if (!$util.isString(message.pretokenizationDelimiter))
          return 'pretokenizationDelimiter: string expected';
      if (message.controlSymbols != null &&
          message.hasOwnProperty('controlSymbols')) {
        if (!Array.isArray(message.controlSymbols))
          return 'controlSymbols: array expected';
        for (let i = 0; i < message.controlSymbols.length; ++i)
          if (!$util.isString(message.controlSymbols[i]))
            return 'controlSymbols: string[] expected';
      }
      if (message.userDefinedSymbols != null &&
          message.hasOwnProperty('userDefinedSymbols')) {
        if (!Array.isArray(message.userDefinedSymbols))
          return 'userDefinedSymbols: array expected';
        for (let i = 0; i < message.userDefinedSymbols.length; ++i)
          if (!$util.isString(message.userDefinedSymbols[i]))
            return 'userDefinedSymbols: string[] expected';
      }
      if (message.requiredChars != null &&
          message.hasOwnProperty('requiredChars'))
        if (!$util.isString(message.requiredChars))
          return 'requiredChars: string expected';
      if (message.byteFallback != null &&
          message.hasOwnProperty('byteFallback'))
        if (typeof message.byteFallback !== 'boolean')
          return 'byteFallback: boolean expected';
      if (message.vocabularyOutputPieceScore != null &&
          message.hasOwnProperty('vocabularyOutputPieceScore'))
        if (typeof message.vocabularyOutputPieceScore !== 'boolean')
          return 'vocabularyOutputPieceScore: boolean expected';
      if (message.hardVocabLimit != null &&
          message.hasOwnProperty('hardVocabLimit'))
        if (typeof message.hardVocabLimit !== 'boolean')
          return 'hardVocabLimit: boolean expected';
      if (message.useAllVocab != null && message.hasOwnProperty('useAllVocab'))
        if (typeof message.useAllVocab !== 'boolean')
          return 'useAllVocab: boolean expected';
      if (message.unkId != null && message.hasOwnProperty('unkId'))
        if (!$util.isInteger(message.unkId)) return 'unkId: integer expected';
      if (message.bosId != null && message.hasOwnProperty('bosId'))
        if (!$util.isInteger(message.bosId)) return 'bosId: integer expected';
      if (message.eosId != null && message.hasOwnProperty('eosId'))
        if (!$util.isInteger(message.eosId)) return 'eosId: integer expected';
      if (message.padId != null && message.hasOwnProperty('padId'))
        if (!$util.isInteger(message.padId)) return 'padId: integer expected';
      if (message.unkPiece != null && message.hasOwnProperty('unkPiece'))
        if (!$util.isString(message.unkPiece))
          return 'unkPiece: string expected';
      if (message.bosPiece != null && message.hasOwnProperty('bosPiece'))
        if (!$util.isString(message.bosPiece))
          return 'bosPiece: string expected';
      if (message.eosPiece != null && message.hasOwnProperty('eosPiece'))
        if (!$util.isString(message.eosPiece))
          return 'eosPiece: string expected';
      if (message.padPiece != null && message.hasOwnProperty('padPiece'))
        if (!$util.isString(message.padPiece))
          return 'padPiece: string expected';
      if (message.unkSurface != null && message.hasOwnProperty('unkSurface'))
        if (!$util.isString(message.unkSurface))
          return 'unkSurface: string expected';
      if (message.trainExtremelyLargeCorpus != null &&
          message.hasOwnProperty('trainExtremelyLargeCorpus'))
        if (typeof message.trainExtremelyLargeCorpus !== 'boolean')
          return 'trainExtremelyLargeCorpus: boolean expected';
      if (message.seedSentencepiecesFile != null &&
          message.hasOwnProperty('seedSentencepiecesFile'))
        if (!$util.isString(message.seedSentencepiecesFile))
          return 'seedSentencepiecesFile: string expected';
      return null;
    };

    /**
     * Creates a TrainerSpec message from a plain object. Also converts values
     * to their respective internal types.
     * @function fromObject
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {sentencepiece.TrainerSpec} TrainerSpec
     */
    TrainerSpec.fromObject = function fromObject(object) {
      if (object instanceof $root.sentencepiece.TrainerSpec) return object;
      let message = new $root.sentencepiece.TrainerSpec();
      if (object.input) {
        if (!Array.isArray(object.input))
          throw TypeError('.sentencepiece.TrainerSpec.input: array expected');
        message.input = [];
        for (let i = 0; i < object.input.length; ++i)
          message.input[i] = String(object.input[i]);
      }
      if (object.inputFormat != null)
        message.inputFormat = String(object.inputFormat);
      if (object.modelPrefix != null)
        message.modelPrefix = String(object.modelPrefix);
      switch (object.modelType) {
        default:
          if (typeof object.modelType === 'number') {
            message.modelType = object.modelType;
            break;
          }
          break;
        case 'UNIGRAM':
        case 1:
          message.modelType = 1;
          break;
        case 'BPE':
        case 2:
          message.modelType = 2;
          break;
        case 'WORD':
        case 3:
          message.modelType = 3;
          break;
        case 'CHAR':
        case 4:
          message.modelType = 4;
          break;
      }
      if (object.vocabSize != null) message.vocabSize = object.vocabSize | 0;
      if (object.acceptLanguage) {
        if (!Array.isArray(object.acceptLanguage))
          throw TypeError(
              '.sentencepiece.TrainerSpec.acceptLanguage: array expected');
        message.acceptLanguage = [];
        for (let i = 0; i < object.acceptLanguage.length; ++i)
          message.acceptLanguage[i] = String(object.acceptLanguage[i]);
      }
      if (object.selfTestSampleSize != null)
        message.selfTestSampleSize = object.selfTestSampleSize | 0;
      if (object.enableDifferentialPrivacy != null)
        message.enableDifferentialPrivacy =
            Boolean(object.enableDifferentialPrivacy);
      if (object.differentialPrivacyNoiseLevel != null)
        message.differentialPrivacyNoiseLevel =
            Number(object.differentialPrivacyNoiseLevel);
      if (object.differentialPrivacyClippingThreshold != null)
        if ($util.Long)
          (message.differentialPrivacyClippingThreshold = $util.Long.fromValue(
               object.differentialPrivacyClippingThreshold))
              .unsigned = true;
        else if (
            typeof object.differentialPrivacyClippingThreshold === 'string')
          message.differentialPrivacyClippingThreshold =
              parseInt(object.differentialPrivacyClippingThreshold, 10);
        else if (
            typeof object.differentialPrivacyClippingThreshold === 'number')
          message.differentialPrivacyClippingThreshold =
              object.differentialPrivacyClippingThreshold;
        else if (
            typeof object.differentialPrivacyClippingThreshold === 'object')
          message.differentialPrivacyClippingThreshold =
              new $util
                  .LongBits(
                      object.differentialPrivacyClippingThreshold.low >>> 0,
                      object.differentialPrivacyClippingThreshold.high >>> 0)
                  .toNumber(true);
      if (object.characterCoverage != null)
        message.characterCoverage = Number(object.characterCoverage);
      if (object.inputSentenceSize != null)
        if ($util.Long)
          (message.inputSentenceSize =
               $util.Long.fromValue(object.inputSentenceSize))
              .unsigned = true;
        else if (typeof object.inputSentenceSize === 'string')
          message.inputSentenceSize = parseInt(object.inputSentenceSize, 10);
        else if (typeof object.inputSentenceSize === 'number')
          message.inputSentenceSize = object.inputSentenceSize;
        else if (typeof object.inputSentenceSize === 'object')
          message.inputSentenceSize =
              new $util
                  .LongBits(
                      object.inputSentenceSize.low >>> 0,
                      object.inputSentenceSize.high >>> 0)
                  .toNumber(true);
      if (object.shuffleInputSentence != null)
        message.shuffleInputSentence = Boolean(object.shuffleInputSentence);
      if (object.miningSentenceSize != null)
        message.miningSentenceSize = object.miningSentenceSize | 0;
      if (object.trainingSentenceSize != null)
        message.trainingSentenceSize = object.trainingSentenceSize | 0;
      if (object.seedSentencepieceSize != null)
        message.seedSentencepieceSize = object.seedSentencepieceSize | 0;
      if (object.shrinkingFactor != null)
        message.shrinkingFactor = Number(object.shrinkingFactor);
      if (object.maxSentenceLength != null)
        message.maxSentenceLength = object.maxSentenceLength | 0;
      if (object.numThreads != null) message.numThreads = object.numThreads | 0;
      if (object.numSubIterations != null)
        message.numSubIterations = object.numSubIterations | 0;
      if (object.maxSentencepieceLength != null)
        message.maxSentencepieceLength = object.maxSentencepieceLength | 0;
      if (object.splitByUnicodeScript != null)
        message.splitByUnicodeScript = Boolean(object.splitByUnicodeScript);
      if (object.splitByNumber != null)
        message.splitByNumber = Boolean(object.splitByNumber);
      if (object.splitByWhitespace != null)
        message.splitByWhitespace = Boolean(object.splitByWhitespace);
      if (object.treatWhitespaceAsSuffix != null)
        message.treatWhitespaceAsSuffix =
            Boolean(object.treatWhitespaceAsSuffix);
      if (object.allowWhitespaceOnlyPieces != null)
        message.allowWhitespaceOnlyPieces =
            Boolean(object.allowWhitespaceOnlyPieces);
      if (object.splitDigits != null)
        message.splitDigits = Boolean(object.splitDigits);
      if (object.pretokenizationDelimiter != null)
        message.pretokenizationDelimiter =
            String(object.pretokenizationDelimiter);
      if (object.controlSymbols) {
        if (!Array.isArray(object.controlSymbols))
          throw TypeError(
              '.sentencepiece.TrainerSpec.controlSymbols: array expected');
        message.controlSymbols = [];
        for (let i = 0; i < object.controlSymbols.length; ++i)
          message.controlSymbols[i] = String(object.controlSymbols[i]);
      }
      if (object.userDefinedSymbols) {
        if (!Array.isArray(object.userDefinedSymbols))
          throw TypeError(
              '.sentencepiece.TrainerSpec.userDefinedSymbols: array expected');
        message.userDefinedSymbols = [];
        for (let i = 0; i < object.userDefinedSymbols.length; ++i)
          message.userDefinedSymbols[i] = String(object.userDefinedSymbols[i]);
      }
      if (object.requiredChars != null)
        message.requiredChars = String(object.requiredChars);
      if (object.byteFallback != null)
        message.byteFallback = Boolean(object.byteFallback);
      if (object.vocabularyOutputPieceScore != null)
        message.vocabularyOutputPieceScore =
            Boolean(object.vocabularyOutputPieceScore);
      if (object.hardVocabLimit != null)
        message.hardVocabLimit = Boolean(object.hardVocabLimit);
      if (object.useAllVocab != null)
        message.useAllVocab = Boolean(object.useAllVocab);
      if (object.unkId != null) message.unkId = object.unkId | 0;
      if (object.bosId != null) message.bosId = object.bosId | 0;
      if (object.eosId != null) message.eosId = object.eosId | 0;
      if (object.padId != null) message.padId = object.padId | 0;
      if (object.unkPiece != null) message.unkPiece = String(object.unkPiece);
      if (object.bosPiece != null) message.bosPiece = String(object.bosPiece);
      if (object.eosPiece != null) message.eosPiece = String(object.eosPiece);
      if (object.padPiece != null) message.padPiece = String(object.padPiece);
      if (object.unkSurface != null)
        message.unkSurface = String(object.unkSurface);
      if (object.trainExtremelyLargeCorpus != null)
        message.trainExtremelyLargeCorpus =
            Boolean(object.trainExtremelyLargeCorpus);
      if (object.seedSentencepiecesFile != null)
        message.seedSentencepiecesFile = String(object.seedSentencepiecesFile);
      return message;
    };

    /**
     * Creates a plain object from a TrainerSpec message. Also converts values
     * to other types if specified.
     * @function toObject
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {sentencepiece.TrainerSpec} message TrainerSpec
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TrainerSpec.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.input = [];
        object.acceptLanguage = [];
        object.controlSymbols = [];
        object.userDefinedSymbols = [];
      }
      if (options.defaults) {
        object.modelPrefix = '';
        object.modelType = options.enums === String ? 'UNIGRAM' : 1;
        object.vocabSize = 8000;
        object.selfTestSampleSize = 0;
        object.inputFormat = '';
        object.characterCoverage = 0.9995;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.inputSentenceSize = options.longs === String ?
              long.toString() :
              options.longs === Number ? long.toNumber() :
                                         long;
        } else
          object.inputSentenceSize = options.longs === String ? '0' : 0;
        object.miningSentenceSize = 0;
        object.trainingSentenceSize = 0;
        object.seedSentencepieceSize = 1000000;
        object.shrinkingFactor = 0.75;
        object.numThreads = 16;
        object.numSubIterations = 2;
        object.maxSentenceLength = 4192;
        object.shuffleInputSentence = true;
        object.maxSentencepieceLength = 16;
        object.splitByUnicodeScript = true;
        object.splitByWhitespace = true;
        object.splitByNumber = true;
        object.treatWhitespaceAsSuffix = false;
        object.splitDigits = false;
        object.allowWhitespaceOnlyPieces = false;
        object.vocabularyOutputPieceScore = true;
        object.hardVocabLimit = true;
        object.useAllVocab = false;
        object.byteFallback = false;
        object.requiredChars = '';
        object.unkId = 0;
        object.bosId = 1;
        object.eosId = 2;
        object.padId = -1;
        object.unkSurface = ' E28187 ';
        object.unkPiece = '<unk>';
        object.bosPiece = '<s>';
        object.eosPiece = '</s>';
        object.padPiece = '<pad>';
        object.trainExtremelyLargeCorpus = false;
        object.enableDifferentialPrivacy = false;
        object.differentialPrivacyNoiseLevel = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.differentialPrivacyClippingThreshold =
              options.longs === String ? long.toString() :
              options.longs === Number ? long.toNumber() :
                                         long;
        } else
          object.differentialPrivacyClippingThreshold =
              options.longs === String ? '0' : 0;
        object.pretokenizationDelimiter = '';
        object.seedSentencepiecesFile = '';
      }
      if (message.input && message.input.length) {
        object.input = [];
        for (let j = 0; j < message.input.length; ++j)
          object.input[j] = message.input[j];
      }
      if (message.modelPrefix != null && message.hasOwnProperty('modelPrefix'))
        object.modelPrefix = message.modelPrefix;
      if (message.modelType != null && message.hasOwnProperty('modelType'))
        object.modelType = options.enums === String ?
            $root.sentencepiece.TrainerSpec.ModelType[message.modelType] ===
                    undefined ?
            message.modelType :
            $root.sentencepiece.TrainerSpec.ModelType[message.modelType] :
            message.modelType;
      if (message.vocabSize != null && message.hasOwnProperty('vocabSize'))
        object.vocabSize = message.vocabSize;
      if (message.acceptLanguage && message.acceptLanguage.length) {
        object.acceptLanguage = [];
        for (let j = 0; j < message.acceptLanguage.length; ++j)
          object.acceptLanguage[j] = message.acceptLanguage[j];
      }
      if (message.selfTestSampleSize != null &&
          message.hasOwnProperty('selfTestSampleSize'))
        object.selfTestSampleSize = message.selfTestSampleSize;
      if (message.inputFormat != null && message.hasOwnProperty('inputFormat'))
        object.inputFormat = message.inputFormat;
      if (message.characterCoverage != null &&
          message.hasOwnProperty('characterCoverage'))
        object.characterCoverage =
            options.json && !isFinite(message.characterCoverage) ?
            String(message.characterCoverage) :
            message.characterCoverage;
      if (message.inputSentenceSize != null &&
          message.hasOwnProperty('inputSentenceSize'))
        if (typeof message.inputSentenceSize === 'number')
          object.inputSentenceSize = options.longs === String ?
              String(message.inputSentenceSize) :
              message.inputSentenceSize;
        else
          object.inputSentenceSize = options.longs === String ?
              $util.Long.prototype.toString.call(message.inputSentenceSize) :
              options.longs === Number ?
              new $util
                  .LongBits(
                      message.inputSentenceSize.low >>> 0,
                      message.inputSentenceSize.high >>> 0)
                  .toNumber(true) :
              message.inputSentenceSize;
      if (message.miningSentenceSize != null &&
          message.hasOwnProperty('miningSentenceSize'))
        object.miningSentenceSize = message.miningSentenceSize;
      if (message.trainingSentenceSize != null &&
          message.hasOwnProperty('trainingSentenceSize'))
        object.trainingSentenceSize = message.trainingSentenceSize;
      if (message.seedSentencepieceSize != null &&
          message.hasOwnProperty('seedSentencepieceSize'))
        object.seedSentencepieceSize = message.seedSentencepieceSize;
      if (message.shrinkingFactor != null &&
          message.hasOwnProperty('shrinkingFactor'))
        object.shrinkingFactor =
            options.json && !isFinite(message.shrinkingFactor) ?
            String(message.shrinkingFactor) :
            message.shrinkingFactor;
      if (message.numThreads != null && message.hasOwnProperty('numThreads'))
        object.numThreads = message.numThreads;
      if (message.numSubIterations != null &&
          message.hasOwnProperty('numSubIterations'))
        object.numSubIterations = message.numSubIterations;
      if (message.maxSentenceLength != null &&
          message.hasOwnProperty('maxSentenceLength'))
        object.maxSentenceLength = message.maxSentenceLength;
      if (message.shuffleInputSentence != null &&
          message.hasOwnProperty('shuffleInputSentence'))
        object.shuffleInputSentence = message.shuffleInputSentence;
      if (message.maxSentencepieceLength != null &&
          message.hasOwnProperty('maxSentencepieceLength'))
        object.maxSentencepieceLength = message.maxSentencepieceLength;
      if (message.splitByUnicodeScript != null &&
          message.hasOwnProperty('splitByUnicodeScript'))
        object.splitByUnicodeScript = message.splitByUnicodeScript;
      if (message.splitByWhitespace != null &&
          message.hasOwnProperty('splitByWhitespace'))
        object.splitByWhitespace = message.splitByWhitespace;
      if (message.splitByNumber != null &&
          message.hasOwnProperty('splitByNumber'))
        object.splitByNumber = message.splitByNumber;
      if (message.treatWhitespaceAsSuffix != null &&
          message.hasOwnProperty('treatWhitespaceAsSuffix'))
        object.treatWhitespaceAsSuffix = message.treatWhitespaceAsSuffix;
      if (message.splitDigits != null && message.hasOwnProperty('splitDigits'))
        object.splitDigits = message.splitDigits;
      if (message.allowWhitespaceOnlyPieces != null &&
          message.hasOwnProperty('allowWhitespaceOnlyPieces'))
        object.allowWhitespaceOnlyPieces = message.allowWhitespaceOnlyPieces;
      if (message.controlSymbols && message.controlSymbols.length) {
        object.controlSymbols = [];
        for (let j = 0; j < message.controlSymbols.length; ++j)
          object.controlSymbols[j] = message.controlSymbols[j];
      }
      if (message.userDefinedSymbols && message.userDefinedSymbols.length) {
        object.userDefinedSymbols = [];
        for (let j = 0; j < message.userDefinedSymbols.length; ++j)
          object.userDefinedSymbols[j] = message.userDefinedSymbols[j];
      }
      if (message.vocabularyOutputPieceScore != null &&
          message.hasOwnProperty('vocabularyOutputPieceScore'))
        object.vocabularyOutputPieceScore = message.vocabularyOutputPieceScore;
      if (message.hardVocabLimit != null &&
          message.hasOwnProperty('hardVocabLimit'))
        object.hardVocabLimit = message.hardVocabLimit;
      if (message.useAllVocab != null && message.hasOwnProperty('useAllVocab'))
        object.useAllVocab = message.useAllVocab;
      if (message.byteFallback != null &&
          message.hasOwnProperty('byteFallback'))
        object.byteFallback = message.byteFallback;
      if (message.requiredChars != null &&
          message.hasOwnProperty('requiredChars'))
        object.requiredChars = message.requiredChars;
      if (message.unkId != null && message.hasOwnProperty('unkId'))
        object.unkId = message.unkId;
      if (message.bosId != null && message.hasOwnProperty('bosId'))
        object.bosId = message.bosId;
      if (message.eosId != null && message.hasOwnProperty('eosId'))
        object.eosId = message.eosId;
      if (message.padId != null && message.hasOwnProperty('padId'))
        object.padId = message.padId;
      if (message.unkSurface != null && message.hasOwnProperty('unkSurface'))
        object.unkSurface = message.unkSurface;
      if (message.unkPiece != null && message.hasOwnProperty('unkPiece'))
        object.unkPiece = message.unkPiece;
      if (message.bosPiece != null && message.hasOwnProperty('bosPiece'))
        object.bosPiece = message.bosPiece;
      if (message.eosPiece != null && message.hasOwnProperty('eosPiece'))
        object.eosPiece = message.eosPiece;
      if (message.padPiece != null && message.hasOwnProperty('padPiece'))
        object.padPiece = message.padPiece;
      if (message.trainExtremelyLargeCorpus != null &&
          message.hasOwnProperty('trainExtremelyLargeCorpus'))
        object.trainExtremelyLargeCorpus = message.trainExtremelyLargeCorpus;
      if (message.enableDifferentialPrivacy != null &&
          message.hasOwnProperty('enableDifferentialPrivacy'))
        object.enableDifferentialPrivacy = message.enableDifferentialPrivacy;
      if (message.differentialPrivacyNoiseLevel != null &&
          message.hasOwnProperty('differentialPrivacyNoiseLevel'))
        object.differentialPrivacyNoiseLevel =
            options.json && !isFinite(message.differentialPrivacyNoiseLevel) ?
            String(message.differentialPrivacyNoiseLevel) :
            message.differentialPrivacyNoiseLevel;
      if (message.differentialPrivacyClippingThreshold != null &&
          message.hasOwnProperty('differentialPrivacyClippingThreshold'))
        if (typeof message.differentialPrivacyClippingThreshold === 'number')
          object.differentialPrivacyClippingThreshold =
              options.longs === String ?
              String(message.differentialPrivacyClippingThreshold) :
              message.differentialPrivacyClippingThreshold;
        else
          object.differentialPrivacyClippingThreshold =
              options.longs === String ?
              $util.Long.prototype.toString.call(
                  message.differentialPrivacyClippingThreshold) :
              options.longs === Number ?
              new $util
                  .LongBits(
                      message.differentialPrivacyClippingThreshold.low >>> 0,
                      message.differentialPrivacyClippingThreshold.high >>> 0)
                  .toNumber(true) :
              message.differentialPrivacyClippingThreshold;
      if (message.pretokenizationDelimiter != null &&
          message.hasOwnProperty('pretokenizationDelimiter'))
        object.pretokenizationDelimiter = message.pretokenizationDelimiter;
      if (message.seedSentencepiecesFile != null &&
          message.hasOwnProperty('seedSentencepiecesFile'))
        object.seedSentencepiecesFile = message.seedSentencepiecesFile;
      return object;
    };

    /**
     * Converts this TrainerSpec to JSON.
     * @function toJSON
     * @memberof sentencepiece.TrainerSpec
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TrainerSpec.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TrainerSpec
     * @function getTypeUrl
     * @memberof sentencepiece.TrainerSpec
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default
     *     "type.googleapis.com")
     * @returns {string} The default type url
     */
    TrainerSpec.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com';
      }
      return typeUrlPrefix + '/sentencepiece.TrainerSpec';
    };

    /**
     * ModelType enum.
     * @name sentencepiece.TrainerSpec.ModelType
     * @enum {number}
     * @property {number} UNIGRAM=1 UNIGRAM value
     * @property {number} BPE=2 BPE value
     * @property {number} WORD=3 WORD value
     * @property {number} CHAR=4 CHAR value
     */
    TrainerSpec.ModelType = (function() {
      const valuesById = {}, values = Object.create(valuesById);
      values[valuesById[1] = 'UNIGRAM'] = 1;
      values[valuesById[2] = 'BPE'] = 2;
      values[valuesById[3] = 'WORD'] = 3;
      values[valuesById[4] = 'CHAR'] = 4;
      return values;
    })();

    return TrainerSpec;
  })();

  sentencepiece.NormalizerSpec = (function() {
    /**
     * Properties of a NormalizerSpec.
     * @memberof sentencepiece
     * @interface INormalizerSpec
     * @property {string|null} [name] NormalizerSpec name
     * @property {Uint8Array|null} [precompiledCharsmap] NormalizerSpec
     * precompiledCharsmap
     * @property {boolean|null} [addDummyPrefix] NormalizerSpec addDummyPrefix
     * @property {boolean|null} [removeExtraWhitespaces] NormalizerSpec
     * removeExtraWhitespaces
     * @property {boolean|null} [escapeWhitespaces] NormalizerSpec
     * escapeWhitespaces
     * @property {string|null} [normalizationRuleTsv] NormalizerSpec
     * normalizationRuleTsv
     */

    /**
     * Constructs a new NormalizerSpec.
     * @memberof sentencepiece
     * @classdesc Represents a NormalizerSpec.
     * @implements INormalizerSpec
     * @constructor
     * @param {sentencepiece.INormalizerSpec=} [properties] Properties to set
     */
    function NormalizerSpec(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * NormalizerSpec name.
     * @member {string} name
     * @memberof sentencepiece.NormalizerSpec
     * @instance
     */
    NormalizerSpec.prototype.name = '';

    /**
     * NormalizerSpec precompiledCharsmap.
     * @member {Uint8Array} precompiledCharsmap
     * @memberof sentencepiece.NormalizerSpec
     * @instance
     */
    NormalizerSpec.prototype.precompiledCharsmap = $util.newBuffer([]);

    /**
     * NormalizerSpec addDummyPrefix.
     * @member {boolean} addDummyPrefix
     * @memberof sentencepiece.NormalizerSpec
     * @instance
     */
    NormalizerSpec.prototype.addDummyPrefix = true;

    /**
     * NormalizerSpec removeExtraWhitespaces.
     * @member {boolean} removeExtraWhitespaces
     * @memberof sentencepiece.NormalizerSpec
     * @instance
     */
    NormalizerSpec.prototype.removeExtraWhitespaces = true;

    /**
     * NormalizerSpec escapeWhitespaces.
     * @member {boolean} escapeWhitespaces
     * @memberof sentencepiece.NormalizerSpec
     * @instance
     */
    NormalizerSpec.prototype.escapeWhitespaces = true;

    /**
     * NormalizerSpec normalizationRuleTsv.
     * @member {string} normalizationRuleTsv
     * @memberof sentencepiece.NormalizerSpec
     * @instance
     */
    NormalizerSpec.prototype.normalizationRuleTsv = '';

    /**
     * Creates a new NormalizerSpec instance using the specified properties.
     * @function create
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {sentencepiece.INormalizerSpec=} [properties] Properties to set
     * @returns {sentencepiece.NormalizerSpec} NormalizerSpec instance
     */
    NormalizerSpec.create = function create(properties) {
      return new NormalizerSpec(properties);
    };

    /**
     * Encodes the specified NormalizerSpec message. Does not implicitly {@link
     * sentencepiece.NormalizerSpec.verify|verify} messages.
     * @function encode
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {sentencepiece.INormalizerSpec} message NormalizerSpec message or
     *     plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NormalizerSpec.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.name != null && Object.hasOwnProperty.call(message, 'name'))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.name);
      if (message.precompiledCharsmap != null &&
          Object.hasOwnProperty.call(message, 'precompiledCharsmap'))
        writer.uint32(/* id 2, wireType 2 =*/ 18)
            .bytes(message.precompiledCharsmap);
      if (message.addDummyPrefix != null &&
          Object.hasOwnProperty.call(message, 'addDummyPrefix'))
        writer.uint32(/* id 3, wireType 0 =*/ 24).bool(message.addDummyPrefix);
      if (message.removeExtraWhitespaces != null &&
          Object.hasOwnProperty.call(message, 'removeExtraWhitespaces'))
        writer.uint32(/* id 4, wireType 0 =*/ 32)
            .bool(message.removeExtraWhitespaces);
      if (message.escapeWhitespaces != null &&
          Object.hasOwnProperty.call(message, 'escapeWhitespaces'))
        writer.uint32(/* id 5, wireType 0 =*/ 40)
            .bool(message.escapeWhitespaces);
      if (message.normalizationRuleTsv != null &&
          Object.hasOwnProperty.call(message, 'normalizationRuleTsv'))
        writer.uint32(/* id 6, wireType 2 =*/ 50)
            .string(message.normalizationRuleTsv);
      return writer;
    };

    /**
     * Encodes the specified NormalizerSpec message, length delimited. Does not
     * implicitly {@link sentencepiece.NormalizerSpec.verify|verify} messages.
     * @function encodeDelimited
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {sentencepiece.INormalizerSpec} message NormalizerSpec message or
     *     plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NormalizerSpec.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a NormalizerSpec message from the specified reader or buffer.
     * @function decode
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
     *     from
     * @param {number} [length] Message length if known beforehand
     * @returns {sentencepiece.NormalizerSpec} NormalizerSpec
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NormalizerSpec.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.sentencepiece.NormalizerSpec();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.name = reader.string();
            break;
          }
          case 2: {
            message.precompiledCharsmap = reader.bytes();
            break;
          }
          case 3: {
            message.addDummyPrefix = reader.bool();
            break;
          }
          case 4: {
            message.removeExtraWhitespaces = reader.bool();
            break;
          }
          case 5: {
            message.escapeWhitespaces = reader.bool();
            break;
          }
          case 6: {
            message.normalizationRuleTsv = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a NormalizerSpec message from the specified reader or buffer,
     * length delimited.
     * @function decodeDelimited
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
     *     from
     * @returns {sentencepiece.NormalizerSpec} NormalizerSpec
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NormalizerSpec.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a NormalizerSpec message.
     * @function verify
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is
     *     not
     */
    NormalizerSpec.verify = function verify(message) {
      if (typeof message !== 'object' || message === null)
        return 'object expected';
      if (message.name != null && message.hasOwnProperty('name'))
        if (!$util.isString(message.name)) return 'name: string expected';
      if (message.precompiledCharsmap != null &&
          message.hasOwnProperty('precompiledCharsmap'))
        if (!(message.precompiledCharsmap &&
                  typeof message.precompiledCharsmap.length === 'number' ||
              $util.isString(message.precompiledCharsmap)))
          return 'precompiledCharsmap: buffer expected';
      if (message.addDummyPrefix != null &&
          message.hasOwnProperty('addDummyPrefix'))
        if (typeof message.addDummyPrefix !== 'boolean')
          return 'addDummyPrefix: boolean expected';
      if (message.removeExtraWhitespaces != null &&
          message.hasOwnProperty('removeExtraWhitespaces'))
        if (typeof message.removeExtraWhitespaces !== 'boolean')
          return 'removeExtraWhitespaces: boolean expected';
      if (message.escapeWhitespaces != null &&
          message.hasOwnProperty('escapeWhitespaces'))
        if (typeof message.escapeWhitespaces !== 'boolean')
          return 'escapeWhitespaces: boolean expected';
      if (message.normalizationRuleTsv != null &&
          message.hasOwnProperty('normalizationRuleTsv'))
        if (!$util.isString(message.normalizationRuleTsv))
          return 'normalizationRuleTsv: string expected';
      return null;
    };

    /**
     * Creates a NormalizerSpec message from a plain object. Also converts
     * values to their respective internal types.
     * @function fromObject
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {sentencepiece.NormalizerSpec} NormalizerSpec
     */
    NormalizerSpec.fromObject = function fromObject(object) {
      if (object instanceof $root.sentencepiece.NormalizerSpec) return object;
      let message = new $root.sentencepiece.NormalizerSpec();
      if (object.name != null) message.name = String(object.name);
      if (object.precompiledCharsmap != null)
        if (typeof object.precompiledCharsmap === 'string')
          $util.base64.decode(
              object.precompiledCharsmap,
              message.precompiledCharsmap = $util.newBuffer(
                  $util.base64.length(object.precompiledCharsmap)),
              0);
        else if (object.precompiledCharsmap.length >= 0)
          message.precompiledCharsmap = object.precompiledCharsmap;
      if (object.addDummyPrefix != null)
        message.addDummyPrefix = Boolean(object.addDummyPrefix);
      if (object.removeExtraWhitespaces != null)
        message.removeExtraWhitespaces = Boolean(object.removeExtraWhitespaces);
      if (object.escapeWhitespaces != null)
        message.escapeWhitespaces = Boolean(object.escapeWhitespaces);
      if (object.normalizationRuleTsv != null)
        message.normalizationRuleTsv = String(object.normalizationRuleTsv);
      return message;
    };

    /**
     * Creates a plain object from a NormalizerSpec message. Also converts
     * values to other types if specified.
     * @function toObject
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {sentencepiece.NormalizerSpec} message NormalizerSpec
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NormalizerSpec.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.name = '';
        if (options.bytes === String)
          object.precompiledCharsmap = '';
        else {
          object.precompiledCharsmap = [];
          if (options.bytes !== Array)
            object.precompiledCharsmap =
                $util.newBuffer(object.precompiledCharsmap);
        }
        object.addDummyPrefix = true;
        object.removeExtraWhitespaces = true;
        object.escapeWhitespaces = true;
        object.normalizationRuleTsv = '';
      }
      if (message.name != null && message.hasOwnProperty('name'))
        object.name = message.name;
      if (message.precompiledCharsmap != null &&
          message.hasOwnProperty('precompiledCharsmap'))
        object.precompiledCharsmap = options.bytes === String ?
            $util.base64.encode(
                message.precompiledCharsmap, 0,
                message.precompiledCharsmap.length) :
            options.bytes === Array ?
            Array.prototype.slice.call(message.precompiledCharsmap) :
            message.precompiledCharsmap;
      if (message.addDummyPrefix != null &&
          message.hasOwnProperty('addDummyPrefix'))
        object.addDummyPrefix = message.addDummyPrefix;
      if (message.removeExtraWhitespaces != null &&
          message.hasOwnProperty('removeExtraWhitespaces'))
        object.removeExtraWhitespaces = message.removeExtraWhitespaces;
      if (message.escapeWhitespaces != null &&
          message.hasOwnProperty('escapeWhitespaces'))
        object.escapeWhitespaces = message.escapeWhitespaces;
      if (message.normalizationRuleTsv != null &&
          message.hasOwnProperty('normalizationRuleTsv'))
        object.normalizationRuleTsv = message.normalizationRuleTsv;
      return object;
    };

    /**
     * Converts this NormalizerSpec to JSON.
     * @function toJSON
     * @memberof sentencepiece.NormalizerSpec
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NormalizerSpec.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for NormalizerSpec
     * @function getTypeUrl
     * @memberof sentencepiece.NormalizerSpec
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default
     *     "type.googleapis.com")
     * @returns {string} The default type url
     */
    NormalizerSpec.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com';
      }
      return typeUrlPrefix + '/sentencepiece.NormalizerSpec';
    };

    return NormalizerSpec;
  })();

  sentencepiece.SelfTestData = (function() {
    /**
     * Properties of a SelfTestData.
     * @memberof sentencepiece
     * @interface ISelfTestData
     * @property {Array.<sentencepiece.SelfTestData.ISample>|null} [samples]
     * SelfTestData samples
     */

    /**
     * Constructs a new SelfTestData.
     * @memberof sentencepiece
     * @classdesc Represents a SelfTestData.
     * @implements ISelfTestData
     * @constructor
     * @param {sentencepiece.ISelfTestData=} [properties] Properties to set
     */
    function SelfTestData(properties) {
      this.samples = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * SelfTestData samples.
     * @member {Array.<sentencepiece.SelfTestData.ISample>} samples
     * @memberof sentencepiece.SelfTestData
     * @instance
     */
    SelfTestData.prototype.samples = $util.emptyArray;

    /**
     * Creates a new SelfTestData instance using the specified properties.
     * @function create
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {sentencepiece.ISelfTestData=} [properties] Properties to set
     * @returns {sentencepiece.SelfTestData} SelfTestData instance
     */
    SelfTestData.create = function create(properties) {
      return new SelfTestData(properties);
    };

    /**
     * Encodes the specified SelfTestData message. Does not implicitly {@link
     * sentencepiece.SelfTestData.verify|verify} messages.
     * @function encode
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {sentencepiece.ISelfTestData} message SelfTestData message or
     *     plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SelfTestData.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.samples != null && message.samples.length)
        for (let i = 0; i < message.samples.length; ++i)
          $root.sentencepiece.SelfTestData.Sample
              .encode(
                  message.samples[i],
                  writer.uint32(/* id 1, wireType 2 =*/ 10).fork())
              .ldelim();
      return writer;
    };

    /**
     * Encodes the specified SelfTestData message, length delimited. Does not
     * implicitly {@link sentencepiece.SelfTestData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {sentencepiece.ISelfTestData} message SelfTestData message or
     *     plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SelfTestData.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SelfTestData message from the specified reader or buffer.
     * @function decode
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
     *     from
     * @param {number} [length] Message length if known beforehand
     * @returns {sentencepiece.SelfTestData} SelfTestData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SelfTestData.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.sentencepiece.SelfTestData();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (!(message.samples && message.samples.length))
              message.samples = [];
            message.samples.push($root.sentencepiece.SelfTestData.Sample.decode(
                reader, reader.uint32()));
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a SelfTestData message from the specified reader or buffer,
     * length delimited.
     * @function decodeDelimited
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
     *     from
     * @returns {sentencepiece.SelfTestData} SelfTestData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SelfTestData.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SelfTestData message.
     * @function verify
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is
     *     not
     */
    SelfTestData.verify = function verify(message) {
      if (typeof message !== 'object' || message === null)
        return 'object expected';
      if (message.samples != null && message.hasOwnProperty('samples')) {
        if (!Array.isArray(message.samples)) return 'samples: array expected';
        for (let i = 0; i < message.samples.length; ++i) {
          let error = $root.sentencepiece.SelfTestData.Sample.verify(
              message.samples[i]);
          if (error) return 'samples.' + error;
        }
      }
      return null;
    };

    /**
     * Creates a SelfTestData message from a plain object. Also converts values
     * to their respective internal types.
     * @function fromObject
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {sentencepiece.SelfTestData} SelfTestData
     */
    SelfTestData.fromObject = function fromObject(object) {
      if (object instanceof $root.sentencepiece.SelfTestData) return object;
      let message = new $root.sentencepiece.SelfTestData();
      if (object.samples) {
        if (!Array.isArray(object.samples))
          throw TypeError(
              '.sentencepiece.SelfTestData.samples: array expected');
        message.samples = [];
        for (let i = 0; i < object.samples.length; ++i) {
          if (typeof object.samples[i] !== 'object')
            throw TypeError(
                '.sentencepiece.SelfTestData.samples: object expected');
          message.samples[i] =
              $root.sentencepiece.SelfTestData.Sample.fromObject(
                  object.samples[i]);
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a SelfTestData message. Also converts values
     * to other types if specified.
     * @function toObject
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {sentencepiece.SelfTestData} message SelfTestData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SelfTestData.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.samples = [];
      if (message.samples && message.samples.length) {
        object.samples = [];
        for (let j = 0; j < message.samples.length; ++j)
          object.samples[j] = $root.sentencepiece.SelfTestData.Sample.toObject(
              message.samples[j], options);
      }
      return object;
    };

    /**
     * Converts this SelfTestData to JSON.
     * @function toJSON
     * @memberof sentencepiece.SelfTestData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SelfTestData.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SelfTestData
     * @function getTypeUrl
     * @memberof sentencepiece.SelfTestData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default
     *     "type.googleapis.com")
     * @returns {string} The default type url
     */
    SelfTestData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com';
      }
      return typeUrlPrefix + '/sentencepiece.SelfTestData';
    };

    SelfTestData.Sample = (function() {
      /**
       * Properties of a Sample.
       * @memberof sentencepiece.SelfTestData
       * @interface ISample
       * @property {string|null} [input] Sample input
       * @property {string|null} [expected] Sample expected
       */

      /**
       * Constructs a new Sample.
       * @memberof sentencepiece.SelfTestData
       * @classdesc Represents a Sample.
       * @implements ISample
       * @constructor
       * @param {sentencepiece.SelfTestData.ISample=} [properties] Properties to
       *     set
       */
      function Sample(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null)
              this[keys[i]] = properties[keys[i]];
      }

      /**
       * Sample input.
       * @member {string} input
       * @memberof sentencepiece.SelfTestData.Sample
       * @instance
       */
      Sample.prototype.input = '';

      /**
       * Sample expected.
       * @member {string} expected
       * @memberof sentencepiece.SelfTestData.Sample
       * @instance
       */
      Sample.prototype.expected = '';

      /**
       * Creates a new Sample instance using the specified properties.
       * @function create
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {sentencepiece.SelfTestData.ISample=} [properties] Properties to
       *     set
       * @returns {sentencepiece.SelfTestData.Sample} Sample instance
       */
      Sample.create = function create(properties) {
        return new Sample(properties);
      };

      /**
       * Encodes the specified Sample message. Does not implicitly {@link
       * sentencepiece.SelfTestData.Sample.verify|verify} messages.
       * @function encode
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {sentencepiece.SelfTestData.ISample} message Sample message or
       *     plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Sample.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.input != null &&
            Object.hasOwnProperty.call(message, 'input'))
          writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.input);
        if (message.expected != null &&
            Object.hasOwnProperty.call(message, 'expected'))
          writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.expected);
        return writer;
      };

      /**
       * Encodes the specified Sample message, length delimited. Does not
       * implicitly {@link sentencepiece.SelfTestData.Sample.verify|verify}
       * messages.
       * @function encodeDelimited
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {sentencepiece.SelfTestData.ISample} message Sample message or
       *     plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Sample.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Sample message from the specified reader or buffer.
       * @function decode
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
       *     from
       * @param {number} [length] Message length if known beforehand
       * @returns {sentencepiece.SelfTestData.Sample} Sample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Sample.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.sentencepiece.SelfTestData.Sample();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.input = reader.string();
              break;
            }
            case 2: {
              message.expected = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Sample message from the specified reader or buffer, length
       * delimited.
       * @function decodeDelimited
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
       *     from
       * @returns {sentencepiece.SelfTestData.Sample} Sample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Sample.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Sample message.
       * @function verify
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is
       *     not
       */
      Sample.verify = function verify(message) {
        if (typeof message !== 'object' || message === null)
          return 'object expected';
        if (message.input != null && message.hasOwnProperty('input'))
          if (!$util.isString(message.input)) return 'input: string expected';
        if (message.expected != null && message.hasOwnProperty('expected'))
          if (!$util.isString(message.expected))
            return 'expected: string expected';
        return null;
      };

      /**
       * Creates a Sample message from a plain object. Also converts values to
       * their respective internal types.
       * @function fromObject
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {sentencepiece.SelfTestData.Sample} Sample
       */
      Sample.fromObject = function fromObject(object) {
        if (object instanceof $root.sentencepiece.SelfTestData.Sample)
          return object;
        let message = new $root.sentencepiece.SelfTestData.Sample();
        if (object.input != null) message.input = String(object.input);
        if (object.expected != null) message.expected = String(object.expected);
        return message;
      };

      /**
       * Creates a plain object from a Sample message. Also converts values to
       * other types if specified.
       * @function toObject
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {sentencepiece.SelfTestData.Sample} message Sample
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Sample.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.input = '';
          object.expected = '';
        }
        if (message.input != null && message.hasOwnProperty('input'))
          object.input = message.input;
        if (message.expected != null && message.hasOwnProperty('expected'))
          object.expected = message.expected;
        return object;
      };

      /**
       * Converts this Sample to JSON.
       * @function toJSON
       * @memberof sentencepiece.SelfTestData.Sample
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Sample.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Sample
       * @function getTypeUrl
       * @memberof sentencepiece.SelfTestData.Sample
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default
       *     "type.googleapis.com")
       * @returns {string} The default type url
       */
      Sample.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = 'type.googleapis.com';
        }
        return typeUrlPrefix + '/sentencepiece.SelfTestData.Sample';
      };

      return Sample;
    })();

    return SelfTestData;
  })();

  sentencepiece.ModelProto = (function() {
    /**
     * Properties of a ModelProto.
     * @memberof sentencepiece
     * @interface IModelProto
     * @property {Array.<sentencepiece.ModelProto.ISentencePiece>|null} [pieces]
     * ModelProto pieces
     * @property {sentencepiece.ITrainerSpec|null} [trainerSpec] ModelProto
     * trainerSpec
     * @property {sentencepiece.INormalizerSpec|null} [normalizerSpec]
     * ModelProto normalizerSpec
     * @property {sentencepiece.ISelfTestData|null} [selfTestData] ModelProto
     * selfTestData
     * @property {sentencepiece.INormalizerSpec|null} [denormalizerSpec]
     * ModelProto denormalizerSpec
     */

    /**
     * Constructs a new ModelProto.
     * @memberof sentencepiece
     * @classdesc Represents a ModelProto.
     * @implements IModelProto
     * @constructor
     * @param {sentencepiece.IModelProto=} [properties] Properties to set
     */
    function ModelProto(properties) {
      this.pieces = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ModelProto pieces.
     * @member {Array.<sentencepiece.ModelProto.ISentencePiece>} pieces
     * @memberof sentencepiece.ModelProto
     * @instance
     */
    ModelProto.prototype.pieces = $util.emptyArray;

    /**
     * ModelProto trainerSpec.
     * @member {sentencepiece.ITrainerSpec|null|undefined} trainerSpec
     * @memberof sentencepiece.ModelProto
     * @instance
     */
    ModelProto.prototype.trainerSpec = null;

    /**
     * ModelProto normalizerSpec.
     * @member {sentencepiece.INormalizerSpec|null|undefined} normalizerSpec
     * @memberof sentencepiece.ModelProto
     * @instance
     */
    ModelProto.prototype.normalizerSpec = null;

    /**
     * ModelProto selfTestData.
     * @member {sentencepiece.ISelfTestData|null|undefined} selfTestData
     * @memberof sentencepiece.ModelProto
     * @instance
     */
    ModelProto.prototype.selfTestData = null;

    /**
     * ModelProto denormalizerSpec.
     * @member {sentencepiece.INormalizerSpec|null|undefined} denormalizerSpec
     * @memberof sentencepiece.ModelProto
     * @instance
     */
    ModelProto.prototype.denormalizerSpec = null;

    /**
     * Creates a new ModelProto instance using the specified properties.
     * @function create
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {sentencepiece.IModelProto=} [properties] Properties to set
     * @returns {sentencepiece.ModelProto} ModelProto instance
     */
    ModelProto.create = function create(properties) {
      return new ModelProto(properties);
    };

    /**
     * Encodes the specified ModelProto message. Does not implicitly {@link
     * sentencepiece.ModelProto.verify|verify} messages.
     * @function encode
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {sentencepiece.IModelProto} message ModelProto message or plain
     *     object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ModelProto.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.pieces != null && message.pieces.length)
        for (let i = 0; i < message.pieces.length; ++i)
          $root.sentencepiece.ModelProto.SentencePiece
              .encode(
                  message.pieces[i],
                  writer.uint32(/* id 1, wireType 2 =*/ 10).fork())
              .ldelim();
      if (message.trainerSpec != null &&
          Object.hasOwnProperty.call(message, 'trainerSpec'))
        $root.sentencepiece.TrainerSpec
            .encode(
                message.trainerSpec,
                writer.uint32(/* id 2, wireType 2 =*/ 18).fork())
            .ldelim();
      if (message.normalizerSpec != null &&
          Object.hasOwnProperty.call(message, 'normalizerSpec'))
        $root.sentencepiece.NormalizerSpec
            .encode(
                message.normalizerSpec,
                writer.uint32(/* id 3, wireType 2 =*/ 26).fork())
            .ldelim();
      if (message.selfTestData != null &&
          Object.hasOwnProperty.call(message, 'selfTestData'))
        $root.sentencepiece.SelfTestData
            .encode(
                message.selfTestData,
                writer.uint32(/* id 4, wireType 2 =*/ 34).fork())
            .ldelim();
      if (message.denormalizerSpec != null &&
          Object.hasOwnProperty.call(message, 'denormalizerSpec'))
        $root.sentencepiece.NormalizerSpec
            .encode(
                message.denormalizerSpec,
                writer.uint32(/* id 5, wireType 2 =*/ 42).fork())
            .ldelim();
      return writer;
    };

    /**
     * Encodes the specified ModelProto message, length delimited. Does not
     * implicitly {@link sentencepiece.ModelProto.verify|verify} messages.
     * @function encodeDelimited
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {sentencepiece.IModelProto} message ModelProto message or plain
     *     object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ModelProto.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ModelProto message from the specified reader or buffer.
     * @function decode
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
     *     from
     * @param {number} [length] Message length if known beforehand
     * @returns {sentencepiece.ModelProto} ModelProto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ModelProto.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.sentencepiece.ModelProto();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (!(message.pieces && message.pieces.length)) message.pieces = [];
            message.pieces.push(
                $root.sentencepiece.ModelProto.SentencePiece.decode(
                    reader, reader.uint32()));
            break;
          }
          case 2: {
            message.trainerSpec =
                $root.sentencepiece.TrainerSpec.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.normalizerSpec = $root.sentencepiece.NormalizerSpec.decode(
                reader, reader.uint32());
            break;
          }
          case 4: {
            message.selfTestData = $root.sentencepiece.SelfTestData.decode(
                reader, reader.uint32());
            break;
          }
          case 5: {
            message.denormalizerSpec =
                $root.sentencepiece.NormalizerSpec.decode(
                    reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a ModelProto message from the specified reader or buffer, length
     * delimited.
     * @function decodeDelimited
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
     *     from
     * @returns {sentencepiece.ModelProto} ModelProto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ModelProto.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ModelProto message.
     * @function verify
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is
     *     not
     */
    ModelProto.verify = function verify(message) {
      if (typeof message !== 'object' || message === null)
        return 'object expected';
      if (message.pieces != null && message.hasOwnProperty('pieces')) {
        if (!Array.isArray(message.pieces)) return 'pieces: array expected';
        for (let i = 0; i < message.pieces.length; ++i) {
          let error = $root.sentencepiece.ModelProto.SentencePiece.verify(
              message.pieces[i]);
          if (error) return 'pieces.' + error;
        }
      }
      if (message.trainerSpec != null &&
          message.hasOwnProperty('trainerSpec')) {
        let error = $root.sentencepiece.TrainerSpec.verify(message.trainerSpec);
        if (error) return 'trainerSpec.' + error;
      }
      if (message.normalizerSpec != null &&
          message.hasOwnProperty('normalizerSpec')) {
        let error =
            $root.sentencepiece.NormalizerSpec.verify(message.normalizerSpec);
        if (error) return 'normalizerSpec.' + error;
      }
      if (message.selfTestData != null &&
          message.hasOwnProperty('selfTestData')) {
        let error =
            $root.sentencepiece.SelfTestData.verify(message.selfTestData);
        if (error) return 'selfTestData.' + error;
      }
      if (message.denormalizerSpec != null &&
          message.hasOwnProperty('denormalizerSpec')) {
        let error =
            $root.sentencepiece.NormalizerSpec.verify(message.denormalizerSpec);
        if (error) return 'denormalizerSpec.' + error;
      }
      return null;
    };

    /**
     * Creates a ModelProto message from a plain object. Also converts values to
     * their respective internal types.
     * @function fromObject
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {sentencepiece.ModelProto} ModelProto
     */
    ModelProto.fromObject = function fromObject(object) {
      if (object instanceof $root.sentencepiece.ModelProto) return object;
      let message = new $root.sentencepiece.ModelProto();
      if (object.pieces) {
        if (!Array.isArray(object.pieces))
          throw TypeError('.sentencepiece.ModelProto.pieces: array expected');
        message.pieces = [];
        for (let i = 0; i < object.pieces.length; ++i) {
          if (typeof object.pieces[i] !== 'object')
            throw TypeError(
                '.sentencepiece.ModelProto.pieces: object expected');
          message.pieces[i] =
              $root.sentencepiece.ModelProto.SentencePiece.fromObject(
                  object.pieces[i]);
        }
      }
      if (object.trainerSpec != null) {
        if (typeof object.trainerSpec !== 'object')
          throw TypeError(
              '.sentencepiece.ModelProto.trainerSpec: object expected');
        message.trainerSpec =
            $root.sentencepiece.TrainerSpec.fromObject(object.trainerSpec);
      }
      if (object.normalizerSpec != null) {
        if (typeof object.normalizerSpec !== 'object')
          throw TypeError(
              '.sentencepiece.ModelProto.normalizerSpec: object expected');
        message.normalizerSpec = $root.sentencepiece.NormalizerSpec.fromObject(
            object.normalizerSpec);
      }
      if (object.selfTestData != null) {
        if (typeof object.selfTestData !== 'object')
          throw TypeError(
              '.sentencepiece.ModelProto.selfTestData: object expected');
        message.selfTestData =
            $root.sentencepiece.SelfTestData.fromObject(object.selfTestData);
      }
      if (object.denormalizerSpec != null) {
        if (typeof object.denormalizerSpec !== 'object')
          throw TypeError(
              '.sentencepiece.ModelProto.denormalizerSpec: object expected');
        message.denormalizerSpec =
            $root.sentencepiece.NormalizerSpec.fromObject(
                object.denormalizerSpec);
      }
      return message;
    };

    /**
     * Creates a plain object from a ModelProto message. Also converts values to
     * other types if specified.
     * @function toObject
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {sentencepiece.ModelProto} message ModelProto
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ModelProto.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.pieces = [];
      if (options.defaults) {
        object.trainerSpec = null;
        object.normalizerSpec = null;
        object.selfTestData = null;
        object.denormalizerSpec = null;
      }
      if (message.pieces && message.pieces.length) {
        object.pieces = [];
        for (let j = 0; j < message.pieces.length; ++j)
          object.pieces[j] =
              $root.sentencepiece.ModelProto.SentencePiece.toObject(
                  message.pieces[j], options);
      }
      if (message.trainerSpec != null && message.hasOwnProperty('trainerSpec'))
        object.trainerSpec = $root.sentencepiece.TrainerSpec.toObject(
            message.trainerSpec, options);
      if (message.normalizerSpec != null &&
          message.hasOwnProperty('normalizerSpec'))
        object.normalizerSpec = $root.sentencepiece.NormalizerSpec.toObject(
            message.normalizerSpec, options);
      if (message.selfTestData != null &&
          message.hasOwnProperty('selfTestData'))
        object.selfTestData = $root.sentencepiece.SelfTestData.toObject(
            message.selfTestData, options);
      if (message.denormalizerSpec != null &&
          message.hasOwnProperty('denormalizerSpec'))
        object.denormalizerSpec = $root.sentencepiece.NormalizerSpec.toObject(
            message.denormalizerSpec, options);
      return object;
    };

    /**
     * Converts this ModelProto to JSON.
     * @function toJSON
     * @memberof sentencepiece.ModelProto
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ModelProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ModelProto
     * @function getTypeUrl
     * @memberof sentencepiece.ModelProto
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default
     *     "type.googleapis.com")
     * @returns {string} The default type url
     */
    ModelProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = 'type.googleapis.com';
      }
      return typeUrlPrefix + '/sentencepiece.ModelProto';
    };

    ModelProto.SentencePiece = (function() {
      /**
       * Properties of a SentencePiece.
       * @memberof sentencepiece.ModelProto
       * @interface ISentencePiece
       * @property {string|null} [piece] SentencePiece piece
       * @property {number|null} [score] SentencePiece score
       * @property {sentencepiece.ModelProto.SentencePiece.Type|null} [type]
       * SentencePiece type
       */

      /**
       * Constructs a new SentencePiece.
       * @memberof sentencepiece.ModelProto
       * @classdesc Represents a SentencePiece.
       * @implements ISentencePiece
       * @constructor
       * @param {sentencepiece.ModelProto.ISentencePiece=} [properties]
       *     Properties to set
       */
      function SentencePiece(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null)
              this[keys[i]] = properties[keys[i]];
      }

      /**
       * SentencePiece piece.
       * @member {string} piece
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @instance
       */
      SentencePiece.prototype.piece = '';

      /**
       * SentencePiece score.
       * @member {number} score
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @instance
       */
      SentencePiece.prototype.score = 0;

      /**
       * SentencePiece type.
       * @member {sentencepiece.ModelProto.SentencePiece.Type} type
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @instance
       */
      SentencePiece.prototype.type = 1;

      /**
       * Creates a new SentencePiece instance using the specified properties.
       * @function create
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {sentencepiece.ModelProto.ISentencePiece=} [properties]
       *     Properties to set
       * @returns {sentencepiece.ModelProto.SentencePiece} SentencePiece
       *     instance
       */
      SentencePiece.create = function create(properties) {
        return new SentencePiece(properties);
      };

      /**
       * Encodes the specified SentencePiece message. Does not implicitly {@link
       * sentencepiece.ModelProto.SentencePiece.verify|verify} messages.
       * @function encode
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {sentencepiece.ModelProto.ISentencePiece} message SentencePiece
       *     message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      SentencePiece.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.piece != null &&
            Object.hasOwnProperty.call(message, 'piece'))
          writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.piece);
        if (message.score != null &&
            Object.hasOwnProperty.call(message, 'score'))
          writer.uint32(/* id 2, wireType 5 =*/ 21).float(message.score);
        if (message.type != null && Object.hasOwnProperty.call(message, 'type'))
          writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.type);
        return writer;
      };

      /**
       * Encodes the specified SentencePiece message, length delimited. Does not
       * implicitly {@link sentencepiece.ModelProto.SentencePiece.verify|verify}
       * messages.
       * @function encodeDelimited
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {sentencepiece.ModelProto.ISentencePiece} message SentencePiece
       *     message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      SentencePiece.encodeDelimited = function encodeDelimited(
          message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a SentencePiece message from the specified reader or buffer.
       * @function decode
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
       *     from
       * @param {number} [length] Message length if known beforehand
       * @returns {sentencepiece.ModelProto.SentencePiece} SentencePiece
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      SentencePiece.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.sentencepiece.ModelProto.SentencePiece();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.piece = reader.string();
              break;
            }
            case 2: {
              message.score = reader.float();
              break;
            }
            case 3: {
              message.type = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a SentencePiece message from the specified reader or buffer,
       * length delimited.
       * @function decodeDelimited
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode
       *     from
       * @returns {sentencepiece.ModelProto.SentencePiece} SentencePiece
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      SentencePiece.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a SentencePiece message.
       * @function verify
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is
       *     not
       */
      SentencePiece.verify = function verify(message) {
        if (typeof message !== 'object' || message === null)
          return 'object expected';
        if (message.piece != null && message.hasOwnProperty('piece'))
          if (!$util.isString(message.piece)) return 'piece: string expected';
        if (message.score != null && message.hasOwnProperty('score'))
          if (typeof message.score !== 'number')
            return 'score: number expected';
        if (message.type != null && message.hasOwnProperty('type'))
          switch (message.type) {
            default:
              return 'type: enum value expected';
            case 1:
            case 2:
            case 3:
            case 4:
            case 6:
            case 5:
              break;
          }
        return null;
      };

      /**
       * Creates a SentencePiece message from a plain object. Also converts
       * values to their respective internal types.
       * @function fromObject
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {sentencepiece.ModelProto.SentencePiece} SentencePiece
       */
      SentencePiece.fromObject = function fromObject(object) {
        if (object instanceof $root.sentencepiece.ModelProto.SentencePiece)
          return object;
        let message = new $root.sentencepiece.ModelProto.SentencePiece();
        if (object.piece != null) message.piece = String(object.piece);
        if (object.score != null) message.score = Number(object.score);
        switch (object.type) {
          default:
            if (typeof object.type === 'number') {
              message.type = object.type;
              break;
            }
            break;
          case 'NORMAL':
          case 1:
            message.type = 1;
            break;
          case 'UNKNOWN':
          case 2:
            message.type = 2;
            break;
          case 'CONTROL':
          case 3:
            message.type = 3;
            break;
          case 'USER_DEFINED':
          case 4:
            message.type = 4;
            break;
          case 'BYTE':
          case 6:
            message.type = 6;
            break;
          case 'UNUSED':
          case 5:
            message.type = 5;
            break;
        }
        return message;
      };

      /**
       * Creates a plain object from a SentencePiece message. Also converts
       * values to other types if specified.
       * @function toObject
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {sentencepiece.ModelProto.SentencePiece} message SentencePiece
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      SentencePiece.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.piece = '';
          object.score = 0;
          object.type = options.enums === String ? 'NORMAL' : 1;
        }
        if (message.piece != null && message.hasOwnProperty('piece'))
          object.piece = message.piece;
        if (message.score != null && message.hasOwnProperty('score'))
          object.score = options.json && !isFinite(message.score) ?
              String(message.score) :
              message.score;
        if (message.type != null && message.hasOwnProperty('type'))
          object.type = options.enums === String ?
              $root.sentencepiece.ModelProto.SentencePiece
                          .Type[message.type] === undefined ?
              message.type :
              $root.sentencepiece.ModelProto.SentencePiece.Type[message.type] :
              message.type;
        return object;
      };

      /**
       * Converts this SentencePiece to JSON.
       * @function toJSON
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      SentencePiece.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for SentencePiece
       * @function getTypeUrl
       * @memberof sentencepiece.ModelProto.SentencePiece
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default
       *     "type.googleapis.com")
       * @returns {string} The default type url
       */
      SentencePiece.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = 'type.googleapis.com';
        }
        return typeUrlPrefix + '/sentencepiece.ModelProto.SentencePiece';
      };

      /**
       * Type enum.
       * @name sentencepiece.ModelProto.SentencePiece.Type
       * @enum {number}
       * @property {number} NORMAL=1 NORMAL value
       * @property {number} UNKNOWN=2 UNKNOWN value
       * @property {number} CONTROL=3 CONTROL value
       * @property {number} USER_DEFINED=4 USER_DEFINED value
       * @property {number} BYTE=6 BYTE value
       * @property {number} UNUSED=5 UNUSED value
       */
      SentencePiece.Type = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[1] = 'NORMAL'] = 1;
        values[valuesById[2] = 'UNKNOWN'] = 2;
        values[valuesById[3] = 'CONTROL'] = 3;
        values[valuesById[4] = 'USER_DEFINED'] = 4;
        values[valuesById[6] = 'BYTE'] = 6;
        values[valuesById[5] = 'UNUSED'] = 5;
        return values;
      })();

      return SentencePiece;
    })();

    return ModelProto;
  })();

  return sentencepiece;
})();

export {$root as default};
