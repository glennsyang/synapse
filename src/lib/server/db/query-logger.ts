import { logger } from '$lib/server/logger';
import type { Logger } from 'drizzle-orm/logger';

// Drizzle's built-in logger (`logger: true`) console.logs every query with its params,
// bypassing $lib/server/logger's redaction — params carry reset tokens, password hashes
// and personal data. Log SQL text only, and only in dev.
export function createQueryLogger(isDev: boolean): Logger | false {
	if (!isDev) return false;
	return { logQuery: (query) => logger.debug('SQL', { query }) };
}
