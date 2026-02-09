/**
 * Reactive offline/online detection
 * Provides reactive state for network connectivity
 */

import { SvelteDate } from 'svelte/reactivity';

export function createOnlineState() {
	let isOnline = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
	let lastOnlineAt = $state<Date | null>(null);
	let lastOfflineAt = $state<Date | null>(null);

	if (typeof window !== 'undefined') {
		// Listen for online/offline events
		const handleOnline = () => {
			isOnline = true;
			lastOnlineAt = new SvelteDate();
		};

		const handleOffline = () => {
			isOnline = false;
			lastOfflineAt = new SvelteDate();
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Cleanup is handled by SvelteKit's lifecycle
	}

	return {
		get isOnline() {
			return isOnline;
		},
		get isOffline() {
			return !isOnline;
		},
		get lastOnlineAt() {
			return lastOnlineAt;
		},
		get lastOfflineAt() {
			return lastOfflineAt;
		}
	};
}

// Global singleton instance
export const onlineState = createOnlineState();
