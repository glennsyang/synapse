import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
	return auth.handler(event.request);
}

export async function POST(event: RequestEvent) {
	return auth.handler(event.request);
}
