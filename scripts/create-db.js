/**
 * Создаёт базу данных poroda (подключается к postgres, затем создаёт poroda).
 * Запуск: node scripts/create-db.js
 * В .env должен быть DATABASE_URL или задай POSTGRES_PASSWORD для пользователя postgres.
 */
const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

const url = process.env.DATABASE_URL;
let connectionString;
if (url) {
  try {
    const u = new URL(url.replace("postgresql://", "http://"));
    const dbName = u.pathname.slice(1).split("?")[0];
    if (dbName === "poroda") {
      connectionString = url.replace("/poroda", "/postgres").replace(/\/poroda\?/, "/postgres?");
    } else {
      connectionString = url.replace(new RegExp("/" + dbName + "\\??"), "/postgres?");
    }
  } catch {
    connectionString = "postgresql://postgres:postgres@localhost:5432/postgres";
  }
} else {
  const pw = process.env.POSTGRES_PASSWORD || "postgres";
  connectionString = `postgresql://postgres:${pw}@localhost:5432/postgres`;
}

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ["poroda"]
    );
    if (res.rows.length > 0) {
      console.log("База poroda уже существует.");
      return;
    }
    await client.query("CREATE DATABASE poroda");
    console.log("База poroda создана.");
  } catch (e) {
    console.error("Ошибка:", e.message);
    console.log("\nСоздай базу вручную в pgAdmin: выполни SQL: CREATE DATABASE poroda;");
  } finally {
    await client.end();
  }
}

main();
