import { getDb } from '$lib/server/db';
import { apiAuditLog } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';

export type ApiAuditEntry = {
	apiKeyId: string;
	userId: string;
	method: string;
	path: string;
	action: string;
	statusCode: number;
};

/**
 * Records which API key performed a write and what happened, for traceability of
 * external/programmatic activity. Never lets a logging failure break the actual API
 * response — an audit-log write failure is logged and swallowed rather than surfaced
 * to the caller.
 */
export async function recordApiWrite(entry: ApiAuditEntry): Promise<void> {
	try {
		await getDb().insert(apiAuditLog).values(entry);
	} catch (error) {
		logger.error('Failed to write API audit log entry', error);
	}
}
