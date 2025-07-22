import * as SQLite from "expo-sqlite";
import * as Application from "expo-application";
import { Run } from "./TableInterfaces";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("trails_db");
    const androidId = Application.getAndroidId();
    await db.execAsync(`PRAGMA KEY = '${androidId}'`);
  }
  return db;
}

async function generate_run_table() {
  try {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        difficulty TEXT,
        duration INTEGER,
        total_distance INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    //todo remove
    await db.execAsync(`
      DELETE FROM runs;
    `);
    await db.execAsync(`
      INSERT INTO runs (name, difficulty, duration, total_distance)
      VALUES ('Morning Run', 'Medium', 3600, 5000);
    `);
    await db.execAsync(`
      INSERT INTO runs (name, difficulty, duration, total_distance)
      VALUES ('Evening Run', 'Hard', 1865, 5600);
    `);
    console.log("Runs table created successfully.");
  } catch (error) {
    console.error("Error creating trails table:", error);
  }
}

async function generate_run_coordinate_table() {
  try {
    const db = await getDb();
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS run_coordinate (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        lat REAL,
        lon REAL,
        alt REAL,
        speed REAL,
        heading REAL,
        FOREIGN KEY (run_id) REFERENCES runs(id)
      );
    `);
    console.log("Run Coordinate table created successfully.");
  } catch (error) {
    console.error("Error creating trails table:", error);
  }
}

export async function generate_tables() {
  await generate_run_table();
  await generate_run_coordinate_table();
}

export async function get_runs() {
  const db = await getDb();
  try {
    const runs = await db.getAllAsync<Run>(
      `SELECT * FROM runs ORDER BY created_at DESC`
    );
    return runs;
  } catch (error) {
    console.error("Failed to fetch runs:", error);
    return [];
  }
}
