<script lang="ts">
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { toggleMode } from 'mode-watcher';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	const handleSignIn = () => goto('/sign-in');
	const handleRegister = () => goto('/register');
</script>

<div class="flex min-h-screen flex-col">
	<!-- Navigation Bar -->
	<header class="w-full border-b border-white/20 bg-white/10 shadow-lg backdrop-blur-md">
		<div class="container mx-auto flex items-center justify-between px-4 py-3">
			<div class="text-xl font-bold"><a href="/">Synapse</a></div>
			<div class="space-x-2">
				<Button variant="outline" onclick={handleSignIn}>Sign In</Button>
				<Button onclick={handleRegister}>Register</Button>
				<Button onclick={toggleMode} variant="outline" size="icon">
					<SunIcon
						class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
					/>
					<MoonIcon
						class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
					/>
					<span class="sr-only">Toggle theme</span>
				</Button>
			</div>
		</div>
	</header>

	<!-- Splash Screen Content -->
	<main class="flex grow items-center justify-center">
		<div
			class="mx-4 w-full max-w-xl rounded-xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-md"
		>
			<h1 class="mb-6 text-4xl font-bold md:text-5xl">Welcome to Synapse</h1>
			<p class="mb-8 text-lg">Take control of your life with our powerful second brain tools.</p>
			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button size="lg" onclick={handleRegister}>Get Started</Button>
				<Button size="lg" variant="outline" onclick={handleSignIn}>Sign In</Button>
			</div>
		</div>
	</main>
</div>
