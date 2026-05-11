// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { Session } from '$lib/server/db/types';
import type { User } from '$lib/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session?: Session;
			user?: User;
			requestId: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}
