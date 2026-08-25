import { timingSafeEqual } from 'node:crypto';

import { CRON_SECRET } from '$app/env/private';
import { runEmailNotifications } from '$lib/server/email/email-notifications';
import { logger } from '$lib/server/logger';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const expectedToken = CRON_SECRET;

	if (!expectedToken || expectedToken.trim().length === 0) {
		logger.error('❌ CRON_SECRET is missing; rejecting cron execution');
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	const expected = Buffer.from(`Bearer ${expectedToken}`);
	const provided = Buffer.from(authHeader ?? '');
	const isValid = provided.length === expected.length && timingSafeEqual(provided, expected);

	if (!isValid) {
		logger.warn('⚠️ Unauthorized cron job attempt');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		logger.info('⏰ Starting cron job for email notifications!');
		await runEmailNotifications();
		logger.info('✅ Email notifications job completed successfully!');
		return json({ success: true, timestamp: new Date().toISOString() });
	} catch (error) {
		logger.error('❌ Email notifications job failed:', error);
		return json({ error: 'Job failed' }, { status: 500 });
	}
};
