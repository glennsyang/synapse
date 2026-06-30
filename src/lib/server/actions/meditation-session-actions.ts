import { logger } from '$lib';
import { editSessionSchema } from '$lib/schemas/meditation';
import { getDb } from '$lib/server/db';
import { meditationSessions } from '$lib/server/db/schema';
import { withAuditFieldsForUpdate } from '$lib/server/db/utils';
import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

export async function handleUpdateSession(request: Request, userId: string) {
	const form = await superValidate(request, zod4(editSessionSchema));

	if (!form.valid) {
		logger.warn('Invalid edit session form data', { errors: form.errors });
		return fail(400, { form });
	}

	try {
		const db = getDb();

		const session = await db.query.meditationSessions.findFirst({
			where: and(eq(meditationSessions.id, form.data.id), eq(meditationSessions.userId, userId))
		});

		if (!session) {
			return fail(404, { form });
		}

		await db
			.update(meditationSessions)
			.set({
				completedAt: new Date(form.data.completed_at).toISOString(),
				preMoodRating: form.data.pre_mood_rating ?? null,
				moodRating: form.data.mood_rating ?? null,
				notes: form.data.notes || null,
				...withAuditFieldsForUpdate()
			})
			.where(and(eq(meditationSessions.id, form.data.id), eq(meditationSessions.userId, userId)));

		logger.info('Meditation session updated', { sessionId: form.data.id, userId });
		return message(form, { type: 'success', text: 'Session updated successfully!' });
	} catch (err) {
		logger.error('Failed to update session', { error: err });
		return message(
			form,
			{ type: 'error', text: 'An error occurred while updating the session.' },
			{ status: 500 }
		);
	}
}

export async function handleDeleteSession(request: Request, userId: string) {
	const formData = await request.formData();
	const sessionId = formData.get('session_id') as string;

	if (!sessionId) {
		return fail(400, { error: 'Session ID is required' });
	}

	try {
		const db = getDb();

		await db
			.delete(meditationSessions)
			.where(and(eq(meditationSessions.id, sessionId), eq(meditationSessions.userId, userId)));

		logger.info('Meditation session deleted', { sessionId, userId });
		return { success: true };
	} catch (err) {
		logger.error('Failed to delete session', { error: err });
		return fail(500, { error: 'Failed to delete session' });
	}
}
