<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';

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

		<div><slot /></div>
	</div>
</div>
