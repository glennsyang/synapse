// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User, Session } from '$lib/types';

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

		// Shape of every sveltekit-superforms `message(form, ...)` payload.
		// Without this declaration superforms falls back to `any`, which let
		// object payloads reach pages that treated the message as a string.
		namespace Superforms {
			type Message = { type: 'error' | 'success'; text: string };
		}
	}
}
