/**
 * @type {import('prettier').Options}
 */
module.exports = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: false,
  trailingComma: "es5",
  bracketSpacing: true,
  bracketSameLine: true,
  overrides: [
    {
      files: "lib/messages/*.ts",
      options: {
        printWidth: 9999,
      },
    },
  ],
}
