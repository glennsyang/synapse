<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';

	import { page } from '$app/state';

	import '../../app.css';
</script>

<ModeWatcher />
<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
>
	<div class="w-full max-w-md px-6">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-4xl font-bold text-slate-900 dark:text-white">Synapse</h1>
			<p class="text-slate-600 dark:text-slate-400">Your Second Brain</p>
		</div>

		<div class="rounded-lg bg-white p-8 shadow-xl dark:bg-slate-800">
			<slot />
		</div>

		{#if page.url.pathname === '/sign-in'}
			<div class="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
				Don't have an account? <a
					href="/register"
					class="text-blue-600 hover:underline dark:text-blue-400">Sign up</a
				>
			</div>
		{:else if page.url.pathname === '/register'}
			<div class="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
				Already have an account? <a
					href="/sign-in"
					class="text-blue-600 hover:underline dark:text-blue-400">Sign in</a
				>
			</div>
		{/if}
	</div>
</div>
