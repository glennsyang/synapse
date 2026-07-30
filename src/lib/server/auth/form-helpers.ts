import { getBetterAuthErrorMessage } from '$lib/utils/auth';
import { isRedirect, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { ZodType } from 'zod';

interface CreateAuthLoadFormOptions {
	includeQueryMessage?: boolean;
	messageParam?: string;
}

type AuthSchema = ZodType<Record<string, unknown>>;

export function redirectIfAuthenticated(user: App.Locals['user']): void {
	if (user) {
		throw redirect(302, '/dashboard');
	}
}

export async function createAuthLoadForm<TSchema extends AuthSchema>(
	schema: TSchema,
	url: URL,
	options: CreateAuthLoadFormOptions = {}
) {
	const { includeQueryMessage = true, messageParam = 'message' } = options;
	const form = await superValidate(zod4(schema));

	if (includeQueryMessage) {
		const MAX_MSG_LEN = 200;
		const queryMessage = url.searchParams.get(messageParam);
		if (queryMessage) {
			form.message = queryMessage.slice(0, MAX_MSG_LEN).replace(/<[^>]*>/g, '');
		}
	}

	return form;
}

export function mapAuthActionError(error: unknown, fallbackMessage: string): string {
	if (isRedirect(error)) {
		throw error;
	}

	return getBetterAuthErrorMessage(error, fallbackMessage);
}
