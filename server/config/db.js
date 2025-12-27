import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const EXPECTED_DB_NAME = "Cash_or_Crash";

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: EXPECTED_DB_NAME // Strict Override
    });

    // 🛡️ SECURITY CHECK: Prevent using wrong/dummy database
    if (conn.connection.name !== EXPECTED_DB_NAME) {
      console.error(`\n❌ SUPER CRITICAL ERROR: Connected to wrong database: '${conn.connection.name}'`);
      console.error(`❌ EXPECTED: '${EXPECTED_DB_NAME}'`);
      console.error("❌ TERMINATING SERVER IMMEDIATELY TO PROTECT DATA.\n");
      process.exit(1);
    }

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database Locked: ${conn.connection.name}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
