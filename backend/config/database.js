import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../../data/podzol.db");
const schemaPath = path.resolve(__dirname, "../models/schema.sql");

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error("Error opening database:", err);
	} else {
		console.log("Connected to SQLite database");
		initializeDatabase();
	}
});

function initializeDatabase() {
	const schema = fs.readFileSync(schemaPath, "utf8");
	db.exec(schema, (err) => {
		if (err) {
			console.error("Error initializing database:", err);
		} else {
			console.log("Database initialized");
		}
	});
}

// Promisify database methods
export const dbGet = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) reject(err);
			else resolve(row);
		});
	});
};

export const dbAll = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
};

export const dbRun = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) reject(err);
			else resolve({ id: this.lastID, changes: this.changes });
		});
	});
};

export default db;
