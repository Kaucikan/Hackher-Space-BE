import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.MONGO_URI,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

export default pool;
