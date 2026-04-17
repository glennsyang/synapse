<script lang="ts">
import { Moon, Sun } from '@lucide/svelte/icons';
import { toggleMode } from 'mode-watcher';

import { page } from '$app/state';
import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import { Separator } from '$lib/components/ui/separator/index.js';
import * as Sidebar from '$lib/components/ui/sidebar/index.js';

// Helper to get page title from URL
function getPageTitle(): string {
	const path = page.url.pathname;
	const segments = path.split('/').filter(Boolean);

	if (segments.length === 0 || path === '/') return 'Synapse';
	if (segments[0] === 'dashboard') return 'Dashboard';

	// Capitalize first letter of first segment
	return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
}

// Helper to get section color based on URL
function getSectionColor(): string {
	const path = page.url.pathname;

	if (path.includes('/dashboard')) return 'border-teal';
	if (path.includes('/journal')) return 'border-blue';
	if (path.includes('/tasks')) return 'border-orange';
	if (path.includes('/fitness')) return 'border-green';
	if (path.includes('/meditation')) return 'border-purple';
	if (path.includes('/visits')) return 'border-pink';

	return 'border-teal';
}

// Helper to build breadcrumb segments
function getBreadcrumbs(): { title: string; url?: string }[] {
	const path = page.url.pathname;
	const segments = path.split('/').filter(Boolean);
	const breadcrumbs: { title: string; url?: string }[] = [];

	if (segments.length === 0) return breadcrumbs;

	// First segment is always the main section
	const mainSection = segments[0];
	breadcrumbs.push({
		title: mainSection.charAt(0).toUpperCase() + mainSection.slice(1),
		url: `/${mainSection}`
	});

	// Add detail pages if they exist
	if (segments.length > 1) {
		// Just show the last segment as current page (no link)
		breadcrumbs.push({
			title: decodeURIComponent(segments[segments.length - 1])
				.split('-')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
		});
	}

	return breadcrumbs;
}

let title = $derived(getPageTitle());
let sectionColor = $derived(getSectionColor());
let breadcrumbs = $derived(getBreadcrumbs());
let showBreadcrumbs = $derived(breadcrumbs.length > 1);
</script>

<header
	class="flex h-(--header-height) shrink-0 flex-col border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-3 py-2 sm:px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ms-1 h-11 w-11 md:h-9 md:w-9" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<div class="flex gap-1">
			{#if showBreadcrumbs}
				<Breadcrumb.Root>
					<Breadcrumb.List>
						{#each breadcrumbs as crumb, i (crumb.title)}
							<Breadcrumb.Item>
								{#if crumb.url}
									<Breadcrumb.Link
										href={crumb.url}
										class="font-display text-xl font-bold md:text-2xl"
									>
										{crumb.title}
									</Breadcrumb.Link>
								{:else}
									<Breadcrumb.Page class="text-xs md:text-sm">{crumb.title}</Breadcrumb.Page>
								{/if}
							</Breadcrumb.Item>
							{#if i < breadcrumbs.length - 1}
								<Breadcrumb.Separator />
							{/if}
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			{:else}
				<h1 class="font-display text-xl font-bold md:text-2xl">{title}</h1>
			{/if}
		</div>
		<div class="ms-auto flex items-center gap-2">
			<Button onclick={toggleMode} variant="outline" size="icon" class="h-8 w-8">
				<Sun
					class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
	</div>
	<!-- Colored accent bar -->
	<div class="h-0.75 w-full {sectionColor}"></div>
</header>
