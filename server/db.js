import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Anjali@24", // Provided by user
  database: "dbms_skill_exchange",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;
