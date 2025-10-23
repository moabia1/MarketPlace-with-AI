// Jest setup file to shim mongoose.Types.ObjectId so it can be called without `new` in older test expectations
const mongoose = require("mongoose");

// Save original constructor
const OriginalObjectId = mongoose.Types.ObjectId;

function ObjectIdShim(value) {
  // allow calling without new
  return new OriginalObjectId(value);
}

// Preserve prototype chain so instanceof checks still work
ObjectIdShim.prototype = OriginalObjectId.prototype;

// Replace in mongoose Types
mongoose.Types.ObjectId = ObjectIdShim;

// Also export for global use if needed
module.exports = {};
