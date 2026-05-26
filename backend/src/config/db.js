const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    return mongoose.connection;
  }

  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  console.log("Connected to Mongo Memory Server");

  process.on("SIGINT", async () => {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    process.exit(0);
  });

  return mongoose.connection;
}

module.exports = connectDB;
