import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

// Lazy on purpose: Next.js imports route modules at build time (e.g. while
// collecting page data) even for fully dynamic routes, so touching env vars
// or opening a connection at module scope would crash the build whenever
// MONGODB_URI isn't set yet (it only needs to exist at request time).
function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI env var. Copy .env.local.example to .env.local and set it.");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect();
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect().catch((err) => {
      clientPromise = undefined; // don't cache a failed attempt
      throw err;
    });
  }
  return clientPromise;
}

let indexesEnsured = false;

export async function getDb() {
  const c = await getClientPromise();
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
