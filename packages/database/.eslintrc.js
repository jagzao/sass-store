module.exports = {
  extends: ["../../.eslintrc.js"],
  env: {
    node: true,
    es6: true,
    browser: true, // Allow globalThis
  },
  rules: {
    // Database-specific rules
    "no-console": "off", // Allow console.log in database package
    "no-undef": "off", // Allow globalThis and other globals
  },
};
