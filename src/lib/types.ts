import type { Component } from 'svelte';

import type { user } from './server/db/schema';

export type User = typeof user.$inferSelect;

export type SidebarNav = {
	navMain: {
		title: string;
		description: string;
		url?: string;
		icon?: Component;
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

export type Exercise = {
	exerciseName: string;
	sets: number | null;
	reps: number | null;
	weightLbs: number | null;
};
