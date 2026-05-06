module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/unit/interactions/**/*.test.ts'],
  moduleNameMapper: {
    // Map bare 'gemini-next-gen-api' package imports to local src
    '^gemini-next-gen-api$': '<rootDir>/src/interactions/index.ts',
    '^gemini-next-gen-api/(.*)$': '<rootDir>/src/interactions/$1',
    // Strip .js extensions so Jest resolves .ts files
    '^(\\..*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          skipLibCheck: true,
          noImplicitAny: false,
          strict: false,
          baseUrl: '.',
          paths: {
            'gemini-next-gen-api': ['./src/interactions/index.ts'],
            'gemini-next-gen-api/*': ['./src/interactions/*'],
          },
          // Use Jest types only (exclude Jasmine which conflicts)
          types: ['jest', 'node'],
        },
      },
    ],
  },
};
