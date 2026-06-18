<script lang="ts">
	import { browser } from '$app/env';

	type ConfettiModule = typeof import('canvas-confetti');
	type ConfettiLauncher = ReturnType<ConfettiModule['create']>;
	type ConfettiOptions = Parameters<ConfettiLauncher>[0];

	interface Props {
		burstId?: number;
		options?: ConfettiOptions;
	}

	const defaultConfettiOptions: ConfettiOptions = {
		particleCount: 400,
		angle: 90,
		spread: 300,
		startVelocity: 35,
		gravity: 0.8,
		ticks: 280,
		origin: { x: 0.5, y: 0.5 }
	};

	let { burstId = 0, options = {} }: Props = $props();

	let confettiLauncherPromise = $state<Promise<ConfettiLauncher> | null>(null);
	let hasSeenIdle = true;
	let lastLaunchedBurstId = 0;

	async function getConfettiLauncher(): Promise<ConfettiLauncher> {
		if (!confettiLauncherPromise) {
			confettiLauncherPromise = import('canvas-confetti').then((module) =>
				module.default.create(undefined, {
					resize: true,
					useWorker: false
				})
			);
		}

		return confettiLauncherPromise;
	}

	async function launchConfetti(options: ConfettiOptions): Promise<void> {
		if (!browser) {
			return;
		}

		const confettiLauncher = await getConfettiLauncher();
		const launchResult = confettiLauncher({
			disableForReducedMotion: true,
			...defaultConfettiOptions,
			...options
		});

		if (launchResult) {
			await launchResult;
		}
	}

	$effect(() => {
		if (burstId <= 0) {
			hasSeenIdle = true;
			return;
		}

		const shouldLaunch = hasSeenIdle || burstId !== lastLaunchedBurstId;
		if (!shouldLaunch) {
			return;
		}

		hasSeenIdle = false;
		lastLaunchedBurstId = burstId;

		void launchConfetti(options).catch(() => {
			// Ignore confetti launch failures to avoid unhandled promise rejections.
		});
	});
</script>
