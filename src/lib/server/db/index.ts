import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { getEnv } from '$lib/../env';
import { logger } from '$lib/utils/logger';

import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
	if (!_db) {
		const env = getEnv();
		const dbUrl = env.DATABASE_URL;

		// Extract file path from DATABASE_URL (remove 'file://' prefix if present)
		const dbPath = dbUrl.replace(/^file:\/\//, '');

		// Ensure the directory exists
		const dir = dirname(dbPath);
		mkdirSync(dir, { recursive: true });

		const connection = new Database(dbPath);
		_db = drizzle(connection, { schema, logger: true });
	}

	return _db;
}

// --- Graceful shutdown for DB connection (if needed) ---
// Note: better-sqlite3 doesn't have a built-in close method on the connection object,
// but if you need to perform any cleanup, you can do it here.
const shutdown = () => {
	if (_db) {
		logger.info('Closing SQLite connection');
		_db.$client.close(); // Closes the better-sqlite3 connection safely
		process.exit(0);
	}
	process.exit(0);
};

// Listen for Fly.io termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
