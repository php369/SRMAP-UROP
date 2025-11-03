import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  // Start MongoDB Memory Server
  const mongod = new MongoMemoryServer({
    binary: {
      version: '7.0.0',
    },
  });

  await mongod.start();
  const uri = mongod.getUri();
  const dbName = 'test-srm-portal';

  // Store connection details globally
  (global as any).__MONGOD__ = mongod;
  (global as any).__MONGO_URI__ = uri;
  (global as any).__MONGO_DB_NAME__ = dbName;

  // Set environment variable for tests
  process.env.MONGODB_URI = uri + dbName;

  console.log('MongoDB Memory Server started:', uri);
}