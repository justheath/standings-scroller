import eslintPluginAstro from "eslint-plugin-astro";
// 1. CHANGE THIS LINE: Use a namespace import for the astro parser
import * as astroEslintParser from "astro-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      // 2. This will now correctly reference the full module object
      parser: astroEslintParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".astro"],
      },
    },
  },
]);
