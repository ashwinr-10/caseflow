import js from "@eslint/js";
import nextPlugin from "eslint-config-next";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  js.configs.recommended,
  ...nextPlugin,
  {
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        React: "readonly", // for automatic JSX runtime
      },
    },
    rules: {
      /* --- React Hooks --- */
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      /* --- React Fast Refresh --- */
      "react-refresh/only-export-components": "warn",

      /* --- TS already does undefined/type checking --- */
      "no-undef": "off",

      /* --- Quality of life --- */
      "react/no-unescaped-entities": "off",
      "react-hooks/incompatible-library": "off",

      /* --- Unused vars, allow _prefix --- */
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
