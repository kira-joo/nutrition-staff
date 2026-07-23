import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

// Cached on `global` so Next.js dev-mode hot reload reuses the connection
// instead of opening a new one on every route handler invocation.
const cached = (global.mongooseConnection ??= { conn: null, promise: null });

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("Missing MONGODB_URI environment variable");
    }

    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "nutrition-staff",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
