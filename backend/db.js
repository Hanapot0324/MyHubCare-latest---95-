// backend/db.js
import mysql from "mysql2/promise";

export const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",       // ← replace with your MySQL password
  database: "myhub", // ← replace with your database name
});
