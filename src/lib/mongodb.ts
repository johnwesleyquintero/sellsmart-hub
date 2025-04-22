async function importMongodbServer() {
  if (typeof window === 'undefined') {
    return import('./mongodb-server');
  }
  throw new Error('MongoDB functions are only available server-side.');
}

export const connectToDatabase = async () => {
  const mongodbServer = await importMongodbServer();
  return mongodbServer.connectToDatabase();
};

export const clientPromise = async () => {
  const mongodbServer = await importMongodbServer();
  return mongodbServer.clientPromise();
};
