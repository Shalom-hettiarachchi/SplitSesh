import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI env var. Copy .env.local.example to .env.local and set it.");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

let indexesEnsured = false;

export async function getDb() {
  const c = await clientPromise;
  const db = c.db(process.env.MONGODB_DB || "jointaccount");
  if (!indexesEnsured) {
    indexesEnsured = true;
    db.collection("users")
      .createIndex({ username: 1 }, { unique: true })
      .catch(() => {});
    db.collection("users")
      .createIndex({ email: 1 }, { unique: true, sparse: true })
      .catch(() => {});
  }
  return db;
}
