import type {
  Document,
  Filter,
  InsertOneResult,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateResult,
} from 'mongodb';
import { Db, MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI ?? '';
const MONGODB_DB = process.env.MONGODB_DB_NAME ?? '';

if (!MONGODB_URI) throw new Error('MONGODB_URI not defined in env');
if (!MONGODB_DB) throw new Error('MONGODB_DB_NAME not defined in env');

let cachedClient: MongoClient;
let cachedDb: Db;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db(MONGODB_DB);
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function createDocument<T extends Document>(
  collectionName: string,
  document: T,
): Promise<InsertOneResult<T>> {
  const { db } = await connectToDatabase();
  const collection = db.collection<T>(collectionName);
  return collection.insertOne(document as OptionalUnlessRequiredId<T>);
}

export async function getDocument<T extends Document>(
  collectionName: string,
  query: Filter<T>,
): Promise<T | null> {
  const { db } = await connectToDatabase();
  const collection = db.collection<T>(collectionName);
  return collection.findOne<T>(query);
}

export async function updateDocument<T extends Document>(
  collectionName: string,
  query: Filter<T>,
  update: UpdateFilter<T>,
): Promise<UpdateResult> {
  const { db } = await connectToDatabase();
  const collection = db.collection<T>(collectionName);
  return collection.updateOne(query, update);
}

export async function deleteDocument(collectionName: string, query: object) {
  const { db } = await connectToDatabase();
  const collection = db.collection(collectionName);
  return collection.deleteOne(query);
}

export async function withTransaction<T>(fn: (db: Db) => Promise<T>) {
  const { client, db } = await connectToDatabase();
  const session = client.startSession();

  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(db);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
