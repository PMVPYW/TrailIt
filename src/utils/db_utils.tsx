import * as SQLite from "expo-sqlite";
import * as Application from "expo-application";
import { Run, RunCoordinate } from "./TableInterfaces";
import * as Location from "expo-location";

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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

export async function getRuns() {
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

export async function CreateEmptyRun(): Promise<Run | null> {
  const db = await getDb();
  let createdRun: Run | null = null;

  try {
    await db.withTransactionAsync(async () => {
      const result = await db.getFirstAsync<Run>(`
        INSERT INTO runs (name, difficulty, duration, total_distance)
        VALUES ('p', 'PENDING', 0, 0)
        RETURNING *;
      `);
      if (result) {
        createdRun = result;
      }
    });
    return createdRun;
  } catch (error) {
    console.error("Failed to create run:", error);
    return null;
  }
}

export async function insertRunCoordinate(
  rund_id: number,
  location: Location.LocationObject
) {
  const db = await getDb();
  try {
    db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO run_coordinate (run_id, lat, lon, alt, speed, heading) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          rund_id,
          location.coords.latitude,
          location.coords.longitude,
          location.coords.altitude,
          location.coords.speed,
          location.coords.heading,
        ]
      );
    });
  } catch (error) {
    console.error("Failed to fetch runs:", error);
    return [];
  }
}

export async function updateRun(run: Run) {
  const db = await getDb();
  try {
    db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE runs SET (name=?, difficulty=?, duration=?, total_distance=?) WHERE id=?;`,
        [run.name, run.difficulty, run.duration, run.total_distance, run.id]
      );
    });
  } catch (error) {
    console.error("Failed to fetch runs:", error);
  }
}

export async function getRunCoordinates(run_id: number | undefined) {
  if (run_id === undefined) {
    return [];
  }
  const db = await getDb();
  try {
    const run_coordinates = await db.getAllAsync<RunCoordinate>(
      `SELECT * FROM run_coordinate WHERE run_id = ? ORDER BY created_at DESC`,
      [run_id]
    );
    console.log(`RUN COORDINATES: ${run_coordinates.length}`)
    return run_coordinates;
  } catch (error) {
    console.error("Failed to fetch runs:", error);
  }
  return []
}
