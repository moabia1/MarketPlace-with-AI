module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  // Run this file after the test framework is installed but before tests run.
  // It starts an in-memory MongoDB and connects mongoose, and exposes `global.app`.
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
