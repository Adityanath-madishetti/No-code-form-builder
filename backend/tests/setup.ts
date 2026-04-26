import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from 'vitest';

process.env.GROQ_API_KEY = 'dummy-key';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

let mongoConfig: MongoMemoryServer;

beforeAll(async () => {
  mongoConfig = await MongoMemoryServer.create();
  const uri = mongoConfig.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoConfig.stop();
});
