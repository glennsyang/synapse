<script lang="ts">
	import MailIcon from '@lucide/svelte/icons/mail';

	import { Button } from '$lib/components/ui/button';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Verify Your Email - Synapse</title>
</svelte:head>

<div class="flex items-center justify-center bg-background px-4 py-12">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
			>
				<MailIcon class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-3xl font-bold tracking-tight">Check your email</h1>
			<p class="mt-2 text-sm text-muted-foreground">We've sent a verification link to</p>
			<p class="mt-1 text-sm font-medium text-foreground">
				{data.email}
			</p>
		</div>

		<div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
			<div class="space-y-4">
				<div>
					<h2 class="text-lg font-semibold">Next steps:</h2>
					<ol class="mt-3 space-y-2 text-sm text-muted-foreground">
						<li class="flex items-start">
							<span class="mr-2 font-semibold text-foreground">1.</span>
							<span>Open the email we just sent you</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 font-semibold text-foreground">2.</span>
							<span>Click the verification link in the email</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 font-semibold text-foreground">3.</span>
							<span>You'll be automatically signed in and redirected to your dashboard</span>
						</li>
					</ol>
				</div>

				<div class="rounded-md bg-muted p-3">
					<p class="text-xs text-muted-foreground">
						💡 <strong>Tip:</strong> If you don't see the email, check your spam or junk folder. The verification
						link will expire in 10 minutes.
					</p>
				</div>
			</div>
		</div>

		<div class="text-center">
			<p class="text-sm text-muted-foreground">
				Wrong email address?
				<a href="/auth/register" class="font-medium text-primary hover:underline">
					Register again
				</a>
			</p>
		</div>

		<div class="text-center">
			<a href="/sign-in">
				<Button variant="outline" class="w-full">Back to Sign In</Button>
			</a>
		</div>
	</div>
</div>
