import type { RequestEvent } from '@sveltejs/kit';

import { auth } from '$lib/server/auth';

export async function GET(event: RequestEvent) {
	return auth.handler(event.request);
}

export async function POST(event: RequestEvent) {
	return auth.handler(event.request);
}
