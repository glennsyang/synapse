import { type RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

import { runEmailNotifications } from '$lib/server/email/email-notifications';
import { logger } from '$lib/utils/logger';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const expectedToken = process.env.CRON_SECRET;

	if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
		logger.warn('⚠️ Unauthorized cron job attempt');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		logger.info('⏰ Starting cron job for email notifications!');
		await runEmailNotifications();
		logger.info('✅ Email notifications job completed successfully!');
		return json({ success: true, timestamp: new Date().toISOString() });
	} catch (error) {
		logger.error('❌ Email notifications job failed:', { error });
		return json({ error: 'Job failed' }, { status: 500 });
	}
};
