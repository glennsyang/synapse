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

export type JournalEntry = {
	id: string;
	userId: string;
	date: string;
	content: string;
	tags: string[] | null;
	location: string | null;
	weather: {
		temp?: number;
		condition?: string;
	} | null;
	createdAt: string;
	updatedAt: string;
};
