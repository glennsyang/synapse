<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="bg-muted flex min-h-screen items-center justify-center">
	<div
		class="grid-paper border-rule w-full max-w-md space-y-6 rounded-[3px] border p-8 text-center"
	>
		<div>
			<h1 class="text-3xl font-bold">Sign Out</h1>
			<p class="text-muted-foreground mt-2">Are you sure you want to sign out?</p>
		</div>

		<form method="POST" use:enhance><Button type="submit" class="w-full">Sign Out</Button></form>

		<div class="text-center"><a href="/dashboard" class="text-sm"> Cancel </a></div>
	</div>
</div>
