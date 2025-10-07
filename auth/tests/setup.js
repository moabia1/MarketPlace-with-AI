const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Keep reference to the in-memory server so we can stop it later
let mongoServer;

/**
 * Start the in-memory MongoDB and connect mongoose.
 * Also require the Express app and attach it to global.app so tests can use it.
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.JWT_SECRET = "testsecret"; // Set a test JWT secret

  // Connect mongoose to the in-memory server
  await mongoose.connect(uri);

  // Require app after mongoose is connected to avoid accidental real DB connections
  global.app = require("../src/app");
});

/**
 * Clear database between each test so tests stay independent.
 */
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

/**
 * Disconnect mongoose and stop the in-memory server when tests finish.
 */
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
