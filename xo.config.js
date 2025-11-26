/** @type {import('xo').FlatXoConfig} */
const xoConfig = [
  {
    ignores: ["scripts/patch.js", "scripts/patch.cjs", "build/**/*"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    space: 2,
    prettier: "compat",
    languageOptions: {
      globals: {
        document: "readonly",
      },
    },
    rules: {
      "prefer-destructuring": 0,
      "import-x/extensions": 0,
      "n/file-extension-in-import": 0,
      "@typescript-eslint/prefer-nullish-coalescing": 0,
      "capitalized-comments": 0,
    },
  },
  {
    files: ["lib/**/*.ts"],
    rules: {
      "@stylistic/indent": 0,
      "@stylistic/indent-binary-ops": 0,
    },
  },
  {
    files: ["lib/messages/*.ts"],
    rules: {
      "@typescript-eslint/naming-convention": 0,
    },
  },
]

export default xoConfig
