import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = {
  async query(sql, params) {
    const result = await pool.query(sql, params);
    return [result.rows];
  },

  async getConnection() {
    const client = await pool.connect();

    return {
      async beginTransaction() {
        await client.query("BEGIN");
      },

      async commit() {
        await client.query("COMMIT");
      },

      async rollback() {
        await client.query("ROLLBACK");
      },

      async query(sql, params) {
        const result = await client.query(sql, params);
        return [result.rows];
      },

      release() {
        client.release();
      },
    };
  },
};

export default db;