import eslintPluginAstro from "eslint-plugin-astro";
// 1. CHANGE THIS LINE: Use a namespace import for the astro parser
import * as astroEslintParser from "astro-eslint-parser";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.astro"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
    languageOptions: {
      // 2. This will now correctly reference the full module object
      parser: astroEslintParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      quotes: ["error", "single", { avoidEscape: true }],
      "jsx-quotes": ["error", "prefer-double"],
    },
  },
]);
