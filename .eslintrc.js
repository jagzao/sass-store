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
    // Basic rules
    "no-console": "warn",
    "no-unused-vars": "off",
  },
};
