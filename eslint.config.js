import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/out/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        node: true,
        es6: true,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Console statements - error in production, warn in development
      "no-console":
        process.env.NODE_ENV === "production" ? "error" : "warn",
      "no-unused-vars": "off",
      "no-debugger":
        process.env.NODE_ENV === "production" ? "error" : "warn",

      // Code quality rules
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "warn",
      "no-unused-expressions": "warn",
    },
  },
  {
    // Allow console in test files
    files: ["**/*.test.ts", "**/*.spec.ts", "**/tests/**/*"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Allow console in scripts
    files: ["scripts/**/*", "tools/**/*"],
    rules: {
      "no-console": "off",
    },
  },
];
