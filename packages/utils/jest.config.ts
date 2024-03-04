// import type { JestConfigWithTsJest } from 'ts-jest'

// const jestConfig: JestConfigWithTsJest = {
//   // [...]
//   extensionsToTreatAsEsm: ['.ts'],
//   moduleNameMapper: {
//     '^(\\.{1,2}/.*)\\.js$': '$1',
//   },
//   transform: {
//     // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
//     // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
//     '^.+\\.tsx?$': [
//       'ts-jest',
//       {
//         useESM: true,
//       },
//     ],
//   },
// }

// export default jestConfig;

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // The following preset allows Jest to use ts-jest to process Typescript
  // files, and to support ESM modules.
  preset: 'ts-jest/presets/default-esm',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  verbose: true,
  // We only want tests to run directly from the 'tests' directory,
  // not from compiled JS code.
  testPathIgnorePatterns: ['^dist/'],
  testMatch: ['**/tests/*.test.ts'],
  automock: false,
};
export default config;
