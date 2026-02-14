import { json } from '@sveltejs/kit';

import { runEmailNotifications } from '$lib/server/email/email-notifications';
import { logger } from '$lib/utils/logger';

import type { RequestHandler } from '../$types';

export const POST: RequestHandler = async ({ request }) => {
	// Verify secret token
	const authHeader = request.headers.get('authorization');
	const expectedToken = process.env.CRON_SECRET;

	if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
		logger.warn('⚠️ Unauthorized cron job attempt');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		logger.info('⏰ Starting email notifications job via API');
		await runEmailNotifications();
		logger.info('✅ Email notifications job completed successfully via API');
		return json({ success: true, timestamp: new Date().toISOString() });
	} catch (error) {
		logger.error('❌ Email notifications job failed:', { error });
		return json({ error: 'Job failed' }, { status: 500 });
	}
};
