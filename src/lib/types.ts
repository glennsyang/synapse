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

export type TaskPageTab = 'kanban' | 'agenda';

export type DailyAgendaSourceType = 'default' | 'custom';

export type DailyAgendaTemplate = {
	id: string;
	templateGroupId: string;
	title: string;
	sortOrder: number;
	daysOfWeek: number[];
	startsOn: string;
	endsOn: string | null;
};

export type DailyAgendaEntry = {
	id: string;
	templateId: string | null;
	templateGroupId: string | null;
	date: string;
	title: string;
	sourceType: DailyAgendaSourceType;
	sortOrder: number;
	completed: boolean;
	completedAt: string | null;
};

export type DailyAgendaDay = {
	date: string;
	dayName: string;
	shortDayName: string;
	dayOfWeek: number;
	dayNumber: number;
	monthLabel: string;
	isToday: boolean;
	isWeekend: boolean;
	isEditable: boolean;
	completionPercentage: number;
	completedCount: number;
	totalCount: number;
	entries: DailyAgendaEntry[];
};

export type DailyAgendaChartPoint = {
	date: string;
	completionPercentage: number;
	completedCount: number;
	totalCount: number;
};

export type DailyAgendaData = {
	weekStart: string;
	weekEnd: string;
	weekLabel: string;
	previousWeekStart: string;
	nextWeekStart: string;
	chartRangeLabel: string;
	isCurrentWeek: boolean;
	overallCompletionPercentage: number;
	overallCompletedCount: number;
	overallTotalCount: number;
	days: DailyAgendaDay[];
	templates: DailyAgendaTemplate[];
	chartPoints: DailyAgendaChartPoint[];
};
