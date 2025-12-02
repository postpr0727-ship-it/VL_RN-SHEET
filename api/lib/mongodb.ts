import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'nurse-schedule';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

if (!uri) {
  throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다.');
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  
  await client.connect();
  
  const db = client.db(dbName);
  
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}

// Vercel Serverless Functions에서 연결을 올바르게 종료하기 위한 헬퍼
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

