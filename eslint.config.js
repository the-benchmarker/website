import { globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config([
  globalIgnores(["dist/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { react },
    extends: [
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parserOptions: {
        ...react.configs.recommended.parserOptions,
        ...react.configs["jsx-runtime"].parserOptions,
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
