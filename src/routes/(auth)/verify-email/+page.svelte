<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import MailIcon from '@lucide/svelte/icons/mail';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Verify Your Email - Synapse</title></svelte:head>

<div class="bg-background flex items-center justify-center px-4 py-12">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<div
				class="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
			>
				<MailIcon class="text-primary h-8 w-8" />
			</div>
			<h1 class="text-3xl font-bold tracking-tight">Check your email</h1>
			<p class="text-muted-foreground mt-2 text-sm">We've sent a verification link to</p>
			<p class="text-foreground mt-1 text-sm font-medium">{data.email}</p>
		</div>

		<div class="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
			<div class="space-y-4">
				<div>
					<h2 class="text-lg font-semibold">Next steps:</h2>
					<ol class="text-muted-foreground mt-3 space-y-2 text-sm">
						<li class="flex items-start">
							<span class="text-foreground mr-2 font-semibold">1.</span>
							<span>Open the email we just sent you</span>
						</li>
						<li class="flex items-start">
							<span class="text-foreground mr-2 font-semibold">2.</span>
							<span>Click the verification link in the email</span>
						</li>
						<li class="flex items-start">
							<span class="text-foreground mr-2 font-semibold">3.</span>
							<span>You'll be automatically signed in and redirected to your dashboard</span>
						</li>
					</ol>
				</div>

				<div class="bg-muted rounded-md p-3">
					<p class="text-muted-foreground text-xs">
						💡 <strong>Tip:</strong> If you don't see the email, check your spam or junk folder. The verification
						link will expire in 10 minutes.
					</p>
				</div>
			</div>
		</div>

		<div class="text-center">
			<p class="text-muted-foreground text-sm">
				Wrong email address?
				<a href="/register" class="text-primary font-medium hover:underline"> Register again </a>
			</p>
		</div>

		<div class="text-center">
			<a href="/sign-in"> <Button variant="outline" class="w-full">Back to Sign In</Button> </a>
		</div>
	</div>
</div>
