module.exports = {
  extends: ["eslint:recommended"],
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    // Console statements - error in production, warn in development
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    "no-unused-vars": "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",

    // Code quality rules
    "no-var": "error",
    "prefer-const": "error",
    "prefer-arrow-callback": "warn",
    "no-unused-expressions": "warn",
  },
  overrides: [
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
  ],
};
