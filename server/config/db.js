import mongoose from "mongoose";
let cached = global.mongoose || { conn: null, promise: null };
export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: "Cash_or_Crash",
      maxPoolSize: 20,              // Better for high DB traffic
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      if (mongoose.connection.name !== "Cash_or_Crash") {
        console.error(
          `❌ CRITICAL: Connected to wrong database '${mongoose.connection.name}'`
        );
        process.exit(1);
      }

      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};
