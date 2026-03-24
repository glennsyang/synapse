/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

const serviceWorker = globalThis.self as unknown as ServiceWorkerGlobalScope;

serviceWorker.addEventListener('install', () => {
	void serviceWorker.skipWaiting();
});

serviceWorker.addEventListener('activate', (event) => {
	event.waitUntil(serviceWorker.clients.claim());
});
