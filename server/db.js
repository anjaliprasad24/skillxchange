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

function convertMysqlToPostgres(sql, params = []) {
  let newParams = [];
  let index = 1;

  let converted = sql
    .replace(/CURDATE\(\)/g, "CURRENT_DATE")
    .replace(/`/g, "")
    .replace(/\bFROM user\b/g, 'FROM "user"')
    .replace(/\bJOIN user\b/g, 'JOIN "user"')
    .replace(/\bUPDATE user\b/g, 'UPDATE "user"')
    .replace(/\bINSERT INTO user\b/g, 'INSERT INTO "user"');

  converted = converted.replace(/\?/g, () => {
    const value = params[newParams.length];

    if (Array.isArray(value)) {
      const placeholders = value.map(() => `$${index++}`);
      newParams.push(...value);
      return placeholders.join(", ");
    }

    newParams.push(value);
    return `$${index++}`;
  });

  if (/^\s*INSERT\s+/i.test(converted) && !/RETURNING/i.test(converted)) {
    converted += " RETURNING *";
  }

  return { sql: converted, params: newParams };
}

function getInsertId(row) {
  if (!row) return undefined;

  const possibleKeys = [
    "user_id",
    "skill_id",
    "course_id",
    "session_id",
    "enrollment_id",
    "transaction_id",
    "event_id",
    "team_id",
    "registration_id",
  ];

  for (const key of possibleKeys) {
    if (row[key] !== undefined) return row[key];
  }

  return Object.values(row)[0];
}

const db = {
  async query(sql, params = []) {
    const converted = convertMysqlToPostgres(sql, params);
    const result = await pool.query(converted.sql, converted.params);

    if (/^\s*INSERT\s+/i.test(sql)) {
      return [
        {
          insertId: getInsertId(result.rows[0]),
          affectedRows: result.rowCount,
        },
      ];
    }

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

      async query(sql, params = []) {
        const converted = convertMysqlToPostgres(sql, params);
        const result = await client.query(converted.sql, converted.params);

        if (/^\s*INSERT\s+/i.test(sql)) {
          return [
            {
              insertId: getInsertId(result.rows[0]),
              affectedRows: result.rowCount,
            },
          ];
        }

        return [result.rows];
      },

      release() {
        client.release();
      },
    };
  },
};

export default db;