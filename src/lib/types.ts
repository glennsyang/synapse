import type { Icon } from '@lucide/svelte';
import type { Component } from 'svelte';

export type SidebarNav = {
	navMain: {
		title: string;
		description: string;
		url?: string;
		icon?: Component<Icon>;
		color?: string;
		items?: { title: string; url: string }[];
	}[];
};
