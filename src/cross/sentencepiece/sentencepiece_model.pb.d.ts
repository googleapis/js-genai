/* eslint-disable */

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as $protobuf from 'protobufjs';
import Long = require('long');
/** Namespace sentencepiece. */
export namespace sentencepiece {
  /** Properties of a TrainerSpec. */
  interface ITrainerSpec {
    /** TrainerSpec input */
    input?: string[] | null;

    /** TrainerSpec inputFormat */
    inputFormat?: string | null;

    /** TrainerSpec modelPrefix */
    modelPrefix?: string | null;

    /** TrainerSpec modelType */
    modelType?: sentencepiece.TrainerSpec.ModelType | null;

    /** TrainerSpec vocabSize */
    vocabSize?: number | null;

    /** TrainerSpec acceptLanguage */
    acceptLanguage?: string[] | null;

    /** TrainerSpec selfTestSampleSize */
    selfTestSampleSize?: number | null;

    /** TrainerSpec enableDifferentialPrivacy */
    enableDifferentialPrivacy?: boolean | null;

    /** TrainerSpec differentialPrivacyNoiseLevel */
    differentialPrivacyNoiseLevel?: number | null;

    /** TrainerSpec differentialPrivacyClippingThreshold */
    differentialPrivacyClippingThreshold?: number | Long | null;

    /** TrainerSpec characterCoverage */
    characterCoverage?: number | null;

    /** TrainerSpec inputSentenceSize */
    inputSentenceSize?: number | Long | null;

    /** TrainerSpec shuffleInputSentence */
    shuffleInputSentence?: boolean | null;

    /** TrainerSpec miningSentenceSize */
    miningSentenceSize?: number | null;

    /** TrainerSpec trainingSentenceSize */
    trainingSentenceSize?: number | null;

    /** TrainerSpec seedSentencepieceSize */
    seedSentencepieceSize?: number | null;

    /** TrainerSpec shrinkingFactor */
    shrinkingFactor?: number | null;

    /** TrainerSpec maxSentenceLength */
    maxSentenceLength?: number | null;

    /** TrainerSpec numThreads */
    numThreads?: number | null;

    /** TrainerSpec numSubIterations */
    numSubIterations?: number | null;

    /** TrainerSpec maxSentencepieceLength */
    maxSentencepieceLength?: number | null;

    /** TrainerSpec splitByUnicodeScript */
    splitByUnicodeScript?: boolean | null;

    /** TrainerSpec splitByNumber */
    splitByNumber?: boolean | null;

    /** TrainerSpec splitByWhitespace */
    splitByWhitespace?: boolean | null;

    /** TrainerSpec treatWhitespaceAsSuffix */
    treatWhitespaceAsSuffix?: boolean | null;

    /** TrainerSpec allowWhitespaceOnlyPieces */
    allowWhitespaceOnlyPieces?: boolean | null;

    /** TrainerSpec splitDigits */
    splitDigits?: boolean | null;

    /** TrainerSpec pretokenizationDelimiter */
    pretokenizationDelimiter?: string | null;

    /** TrainerSpec controlSymbols */
    controlSymbols?: string[] | null;

    /** TrainerSpec userDefinedSymbols */
    userDefinedSymbols?: string[] | null;

    /** TrainerSpec requiredChars */
    requiredChars?: string | null;

    /** TrainerSpec byteFallback */
    byteFallback?: boolean | null;

    /** TrainerSpec vocabularyOutputPieceScore */
    vocabularyOutputPieceScore?: boolean | null;

    /** TrainerSpec hardVocabLimit */
    hardVocabLimit?: boolean | null;

    /** TrainerSpec useAllVocab */
    useAllVocab?: boolean | null;

    /** TrainerSpec unkId */
    unkId?: number | null;

    /** TrainerSpec bosId */
    bosId?: number | null;

    /** TrainerSpec eosId */
    eosId?: number | null;

    /** TrainerSpec padId */
    padId?: number | null;

    /** TrainerSpec unkPiece */
    unkPiece?: string | null;

    /** TrainerSpec bosPiece */
    bosPiece?: string | null;

    /** TrainerSpec eosPiece */
    eosPiece?: string | null;

    /** TrainerSpec padPiece */
    padPiece?: string | null;

    /** TrainerSpec unkSurface */
    unkSurface?: string | null;

    /** TrainerSpec trainExtremelyLargeCorpus */
    trainExtremelyLargeCorpus?: boolean | null;

    /** TrainerSpec seedSentencepiecesFile */
    seedSentencepiecesFile?: string | null;
  }

  /** Represents a TrainerSpec. */
  class TrainerSpec implements ITrainerSpec {
    /**
     * Constructs a new TrainerSpec.
     * @param [properties] Properties to set
     */
    constructor(properties?: sentencepiece.ITrainerSpec);

    /** TrainerSpec input. */
    public input: string[];

    /** TrainerSpec inputFormat. */
    public inputFormat: string;

    /** TrainerSpec modelPrefix. */
    public modelPrefix: string;

    /** TrainerSpec modelType. */
    public modelType: sentencepiece.TrainerSpec.ModelType;

    /** TrainerSpec vocabSize. */
    public vocabSize: number;

    /** TrainerSpec acceptLanguage. */
    public acceptLanguage: string[];

    /** TrainerSpec selfTestSampleSize. */
    public selfTestSampleSize: number;

    /** TrainerSpec enableDifferentialPrivacy. */
    public enableDifferentialPrivacy: boolean;

    /** TrainerSpec differentialPrivacyNoiseLevel. */
    public differentialPrivacyNoiseLevel: number;

    /** TrainerSpec differentialPrivacyClippingThreshold. */
    public differentialPrivacyClippingThreshold: number | Long;

    /** TrainerSpec characterCoverage. */
    public characterCoverage: number;

    /** TrainerSpec inputSentenceSize. */
    public inputSentenceSize: number | Long;

    /** TrainerSpec shuffleInputSentence. */
    public shuffleInputSentence: boolean;

    /** TrainerSpec miningSentenceSize. */
    public miningSentenceSize: number;

    /** TrainerSpec trainingSentenceSize. */
    public trainingSentenceSize: number;

    /** TrainerSpec seedSentencepieceSize. */
    public seedSentencepieceSize: number;

    /** TrainerSpec shrinkingFactor. */
    public shrinkingFactor: number;

    /** TrainerSpec maxSentenceLength. */
    public maxSentenceLength: number;

    /** TrainerSpec numThreads. */
    public numThreads: number;

    /** TrainerSpec numSubIterations. */
    public numSubIterations: number;

    /** TrainerSpec maxSentencepieceLength. */
    public maxSentencepieceLength: number;

    /** TrainerSpec splitByUnicodeScript. */
    public splitByUnicodeScript: boolean;

    /** TrainerSpec splitByNumber. */
    public splitByNumber: boolean;

    /** TrainerSpec splitByWhitespace. */
    public splitByWhitespace: boolean;

    /** TrainerSpec treatWhitespaceAsSuffix. */
    public treatWhitespaceAsSuffix: boolean;

    /** TrainerSpec allowWhitespaceOnlyPieces. */
    public allowWhitespaceOnlyPieces: boolean;

    /** TrainerSpec splitDigits. */
    public splitDigits: boolean;

    /** TrainerSpec pretokenizationDelimiter. */
    public pretokenizationDelimiter: string;

    /** TrainerSpec controlSymbols. */
    public controlSymbols: string[];

    /** TrainerSpec userDefinedSymbols. */
    public userDefinedSymbols: string[];

    /** TrainerSpec requiredChars. */
    public requiredChars: string;

    /** TrainerSpec byteFallback. */
    public byteFallback: boolean;

    /** TrainerSpec vocabularyOutputPieceScore. */
    public vocabularyOutputPieceScore: boolean;

    /** TrainerSpec hardVocabLimit. */
    public hardVocabLimit: boolean;

    /** TrainerSpec useAllVocab. */
    public useAllVocab: boolean;

    /** TrainerSpec unkId. */
    public unkId: number;

    /** TrainerSpec bosId. */
    public bosId: number;

    /** TrainerSpec eosId. */
    public eosId: number;

    /** TrainerSpec padId. */
    public padId: number;

    /** TrainerSpec unkPiece. */
    public unkPiece: string;

    /** TrainerSpec bosPiece. */
    public bosPiece: string;

    /** TrainerSpec eosPiece. */
    public eosPiece: string;

    /** TrainerSpec padPiece. */
    public padPiece: string;

    /** TrainerSpec unkSurface. */
    public unkSurface: string;

    /** TrainerSpec trainExtremelyLargeCorpus. */
    public trainExtremelyLargeCorpus: boolean;

    /** TrainerSpec seedSentencepiecesFile. */
    public seedSentencepiecesFile: string;

    /**
     * Creates a new TrainerSpec instance using the specified properties.
     * @param [properties] Properties to set
     * @returns TrainerSpec instance
     */
    public static create(
      properties?: sentencepiece.ITrainerSpec,
    ): sentencepiece.TrainerSpec;

    /**
     * Encodes the specified TrainerSpec message. Does not implicitly {@link sentencepiece.TrainerSpec.verify|verify} messages.
     * @param message TrainerSpec message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: sentencepiece.ITrainerSpec,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified TrainerSpec message, length delimited. Does not implicitly {@link sentencepiece.TrainerSpec.verify|verify} messages.
     * @param message TrainerSpec message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: sentencepiece.ITrainerSpec,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a TrainerSpec message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns TrainerSpec
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): sentencepiece.TrainerSpec;

    /**
     * Decodes a TrainerSpec message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns TrainerSpec
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): sentencepiece.TrainerSpec;

    /**
     * Verifies a TrainerSpec message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: {[k: string]: any}): string | null;

    /**
     * Creates a TrainerSpec message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns TrainerSpec
     */
    public static fromObject(object: {
      [k: string]: any;
    }): sentencepiece.TrainerSpec;

    /**
     * Creates a plain object from a TrainerSpec message. Also converts values to other types if specified.
     * @param message TrainerSpec
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: sentencepiece.TrainerSpec,
      options?: $protobuf.IConversionOptions,
    ): {[k: string]: any};

    /**
     * Converts this TrainerSpec to JSON.
     * @returns JSON object
     */
    public toJSON(): {[k: string]: any};

    /**
     * Gets the default type url for TrainerSpec
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  namespace TrainerSpec {
    /** ModelType enum. */
    enum ModelType {
      UNIGRAM = 1,
      BPE = 2,
      WORD = 3,
      CHAR = 4,
    }
  }

  /** Properties of a NormalizerSpec. */
  interface INormalizerSpec {
    /** NormalizerSpec name */
    name?: string | null;

    /** NormalizerSpec precompiledCharsmap */
    precompiledCharsmap?: Uint8Array | null;

    /** NormalizerSpec addDummyPrefix */
    addDummyPrefix?: boolean | null;

    /** NormalizerSpec removeExtraWhitespaces */
    removeExtraWhitespaces?: boolean | null;

    /** NormalizerSpec escapeWhitespaces */
    escapeWhitespaces?: boolean | null;

    /** NormalizerSpec normalizationRuleTsv */
    normalizationRuleTsv?: string | null;
  }

  /** Represents a NormalizerSpec. */
  class NormalizerSpec implements INormalizerSpec {
    /**
     * Constructs a new NormalizerSpec.
     * @param [properties] Properties to set
     */
    constructor(properties?: sentencepiece.INormalizerSpec);

    /** NormalizerSpec name. */
    public name: string;

    /** NormalizerSpec precompiledCharsmap. */
    public precompiledCharsmap: Uint8Array;

    /** NormalizerSpec addDummyPrefix. */
    public addDummyPrefix: boolean;

    /** NormalizerSpec removeExtraWhitespaces. */
    public removeExtraWhitespaces: boolean;

    /** NormalizerSpec escapeWhitespaces. */
    public escapeWhitespaces: boolean;

    /** NormalizerSpec normalizationRuleTsv. */
    public normalizationRuleTsv: string;

    /**
     * Creates a new NormalizerSpec instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NormalizerSpec instance
     */
    public static create(
      properties?: sentencepiece.INormalizerSpec,
    ): sentencepiece.NormalizerSpec;

    /**
     * Encodes the specified NormalizerSpec message. Does not implicitly {@link sentencepiece.NormalizerSpec.verify|verify} messages.
     * @param message NormalizerSpec message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: sentencepiece.INormalizerSpec,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified NormalizerSpec message, length delimited. Does not implicitly {@link sentencepiece.NormalizerSpec.verify|verify} messages.
     * @param message NormalizerSpec message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: sentencepiece.INormalizerSpec,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a NormalizerSpec message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns NormalizerSpec
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): sentencepiece.NormalizerSpec;

    /**
     * Decodes a NormalizerSpec message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns NormalizerSpec
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): sentencepiece.NormalizerSpec;

    /**
     * Verifies a NormalizerSpec message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: {[k: string]: any}): string | null;

    /**
     * Creates a NormalizerSpec message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NormalizerSpec
     */
    public static fromObject(object: {
      [k: string]: any;
    }): sentencepiece.NormalizerSpec;

    /**
     * Creates a plain object from a NormalizerSpec message. Also converts values to other types if specified.
     * @param message NormalizerSpec
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: sentencepiece.NormalizerSpec,
      options?: $protobuf.IConversionOptions,
    ): {[k: string]: any};

    /**
     * Converts this NormalizerSpec to JSON.
     * @returns JSON object
     */
    public toJSON(): {[k: string]: any};

    /**
     * Gets the default type url for NormalizerSpec
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a SelfTestData. */
  interface ISelfTestData {
    /** SelfTestData samples */
    samples?: sentencepiece.SelfTestData.ISample[] | null;
  }

  /** Represents a SelfTestData. */
  class SelfTestData implements ISelfTestData {
    /**
     * Constructs a new SelfTestData.
     * @param [properties] Properties to set
     */
    constructor(properties?: sentencepiece.ISelfTestData);

    /** SelfTestData samples. */
    public samples: sentencepiece.SelfTestData.ISample[];

    /**
     * Creates a new SelfTestData instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SelfTestData instance
     */
    public static create(
      properties?: sentencepiece.ISelfTestData,
    ): sentencepiece.SelfTestData;

    /**
     * Encodes the specified SelfTestData message. Does not implicitly {@link sentencepiece.SelfTestData.verify|verify} messages.
     * @param message SelfTestData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: sentencepiece.ISelfTestData,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified SelfTestData message, length delimited. Does not implicitly {@link sentencepiece.SelfTestData.verify|verify} messages.
     * @param message SelfTestData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: sentencepiece.ISelfTestData,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a SelfTestData message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SelfTestData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): sentencepiece.SelfTestData;

    /**
     * Decodes a SelfTestData message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SelfTestData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): sentencepiece.SelfTestData;

    /**
     * Verifies a SelfTestData message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: {[k: string]: any}): string | null;

    /**
     * Creates a SelfTestData message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SelfTestData
     */
    public static fromObject(object: {
      [k: string]: any;
    }): sentencepiece.SelfTestData;

    /**
     * Creates a plain object from a SelfTestData message. Also converts values to other types if specified.
     * @param message SelfTestData
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: sentencepiece.SelfTestData,
      options?: $protobuf.IConversionOptions,
    ): {[k: string]: any};

    /**
     * Converts this SelfTestData to JSON.
     * @returns JSON object
     */
    public toJSON(): {[k: string]: any};

    /**
     * Gets the default type url for SelfTestData
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  namespace SelfTestData {
    /** Properties of a Sample. */
    interface ISample {
      /** Sample input */
      input?: string | null;

      /** Sample expected */
      expected?: string | null;
    }

    /** Represents a Sample. */
    class Sample implements ISample {
      /**
       * Constructs a new Sample.
       * @param [properties] Properties to set
       */
      constructor(properties?: sentencepiece.SelfTestData.ISample);

      /** Sample input. */
      public input: string;

      /** Sample expected. */
      public expected: string;

      /**
       * Creates a new Sample instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Sample instance
       */
      public static create(
        properties?: sentencepiece.SelfTestData.ISample,
      ): sentencepiece.SelfTestData.Sample;

      /**
       * Encodes the specified Sample message. Does not implicitly {@link sentencepiece.SelfTestData.Sample.verify|verify} messages.
       * @param message Sample message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: sentencepiece.SelfTestData.ISample,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer;

      /**
       * Encodes the specified Sample message, length delimited. Does not implicitly {@link sentencepiece.SelfTestData.Sample.verify|verify} messages.
       * @param message Sample message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: sentencepiece.SelfTestData.ISample,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer;

      /**
       * Decodes a Sample message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Sample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): sentencepiece.SelfTestData.Sample;

      /**
       * Decodes a Sample message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Sample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): sentencepiece.SelfTestData.Sample;

      /**
       * Verifies a Sample message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null;

      /**
       * Creates a Sample message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Sample
       */
      public static fromObject(object: {
        [k: string]: any;
      }): sentencepiece.SelfTestData.Sample;

      /**
       * Creates a plain object from a Sample message. Also converts values to other types if specified.
       * @param message Sample
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: sentencepiece.SelfTestData.Sample,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any};

      /**
       * Converts this Sample to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any};

      /**
       * Gets the default type url for Sample
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }

  /** Properties of a ModelProto. */
  interface IModelProto {
    /** ModelProto pieces */
    pieces?: sentencepiece.ModelProto.ISentencePiece[] | null;

    /** ModelProto trainerSpec */
    trainerSpec?: sentencepiece.ITrainerSpec | null;

    /** ModelProto normalizerSpec */
    normalizerSpec?: sentencepiece.INormalizerSpec | null;

    /** ModelProto selfTestData */
    selfTestData?: sentencepiece.ISelfTestData | null;

    /** ModelProto denormalizerSpec */
    denormalizerSpec?: sentencepiece.INormalizerSpec | null;
  }

  /** Represents a ModelProto. */
  class ModelProto implements IModelProto {
    /**
     * Constructs a new ModelProto.
     * @param [properties] Properties to set
     */
    constructor(properties?: sentencepiece.IModelProto);

    /** ModelProto pieces. */
    public pieces: sentencepiece.ModelProto.ISentencePiece[];

    /** ModelProto trainerSpec. */
    public trainerSpec?: sentencepiece.ITrainerSpec | null;

    /** ModelProto normalizerSpec. */
    public normalizerSpec?: sentencepiece.INormalizerSpec | null;

    /** ModelProto selfTestData. */
    public selfTestData?: sentencepiece.ISelfTestData | null;

    /** ModelProto denormalizerSpec. */
    public denormalizerSpec?: sentencepiece.INormalizerSpec | null;

    /**
     * Creates a new ModelProto instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ModelProto instance
     */
    public static create(
      properties?: sentencepiece.IModelProto,
    ): sentencepiece.ModelProto;

    /**
     * Encodes the specified ModelProto message. Does not implicitly {@link sentencepiece.ModelProto.verify|verify} messages.
     * @param message ModelProto message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: sentencepiece.IModelProto,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Encodes the specified ModelProto message, length delimited. Does not implicitly {@link sentencepiece.ModelProto.verify|verify} messages.
     * @param message ModelProto message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: sentencepiece.IModelProto,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a ModelProto message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ModelProto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): sentencepiece.ModelProto;

    /**
     * Decodes a ModelProto message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ModelProto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): sentencepiece.ModelProto;

    /**
     * Verifies a ModelProto message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: {[k: string]: any}): string | null;

    /**
     * Creates a ModelProto message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ModelProto
     */
    public static fromObject(object: {
      [k: string]: any;
    }): sentencepiece.ModelProto;

    /**
     * Creates a plain object from a ModelProto message. Also converts values to other types if specified.
     * @param message ModelProto
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: sentencepiece.ModelProto,
      options?: $protobuf.IConversionOptions,
    ): {[k: string]: any};

    /**
     * Converts this ModelProto to JSON.
     * @returns JSON object
     */
    public toJSON(): {[k: string]: any};

    /**
     * Gets the default type url for ModelProto
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  namespace ModelProto {
    /** Properties of a SentencePiece. */
    interface ISentencePiece {
      /** SentencePiece piece */
      piece?: string | null;

      /** SentencePiece score */
      score?: number | null;

      /** SentencePiece type */
      type?: sentencepiece.ModelProto.SentencePiece.Type | null;
    }

    /** Represents a SentencePiece. */
    class SentencePiece implements ISentencePiece {
      /**
       * Constructs a new SentencePiece.
       * @param [properties] Properties to set
       */
      constructor(properties?: sentencepiece.ModelProto.ISentencePiece);

      /** SentencePiece piece. */
      public piece: string;

      /** SentencePiece score. */
      public score: number;

      /** SentencePiece type. */
      public type: sentencepiece.ModelProto.SentencePiece.Type;

      /**
       * Creates a new SentencePiece instance using the specified properties.
       * @param [properties] Properties to set
       * @returns SentencePiece instance
       */
      public static create(
        properties?: sentencepiece.ModelProto.ISentencePiece,
      ): sentencepiece.ModelProto.SentencePiece;

      /**
       * Encodes the specified SentencePiece message. Does not implicitly {@link sentencepiece.ModelProto.SentencePiece.verify|verify} messages.
       * @param message SentencePiece message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: sentencepiece.ModelProto.ISentencePiece,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer;

      /**
       * Encodes the specified SentencePiece message, length delimited. Does not implicitly {@link sentencepiece.ModelProto.SentencePiece.verify|verify} messages.
       * @param message SentencePiece message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: sentencepiece.ModelProto.ISentencePiece,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer;

      /**
       * Decodes a SentencePiece message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns SentencePiece
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): sentencepiece.ModelProto.SentencePiece;

      /**
       * Decodes a SentencePiece message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns SentencePiece
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): sentencepiece.ModelProto.SentencePiece;

      /**
       * Verifies a SentencePiece message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null;

      /**
       * Creates a SentencePiece message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns SentencePiece
       */
      public static fromObject(object: {
        [k: string]: any;
      }): sentencepiece.ModelProto.SentencePiece;

      /**
       * Creates a plain object from a SentencePiece message. Also converts values to other types if specified.
       * @param message SentencePiece
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: sentencepiece.ModelProto.SentencePiece,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any};

      /**
       * Converts this SentencePiece to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any};

      /**
       * Gets the default type url for SentencePiece
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace SentencePiece {
      /** Type enum. */
      enum Type {
        NORMAL = 1,
        UNKNOWN = 2,
        CONTROL = 3,
        USER_DEFINED = 4,
        BYTE = 6,
        UNUSED = 5,
      }
    }
  }
}
