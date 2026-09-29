import type { TaskState } from '$lib/schemas/task';

export type TaskPriority = 1 | 2 | 3 | 4;

export type TaskDueDateFilter = 'overdue' | 'today' | 'upcoming';

export type TaskSummary = {
	id: string;
	taskNumber: number;
	title: string;
	description: string | null;
	state: TaskState;
	sortOrder: number;
	dueDate: string | null;
	priority: number;
	tags: string[] | null;
};

type TaskPriorityMeta = {
	label: string;
	valueLabel: string;
	dotClass: string;
	badgeClass: string;
};

type TaskStateMeta = {
	label: string;
	dotClass: string;
	badgeClass: string;
	headerClass: string;
	emptyClass: string;
};

type TaskDueDateFilterMeta = {
	label: string;
	valueLabel: string;
	dotClass: string;
	badgeClass: string;
};

export const taskPriorityMeta: Record<TaskPriority, TaskPriorityMeta> = {
	1: {
		label: 'Critical',
		valueLabel: '1 - Critical',
		dotClass: 'bg-destructive dark:bg-destructive/8',
		badgeClass:
			'border-destructive/40 bg-destructive/8 text-destructive dark:border-destructive/35 dark:bg-destructive/10 dark:text-destructive'
	},
	2: {
		label: 'High',
		valueLabel: '2 - High',
		dotClass: 'bg-pen-tasks dark:bg-pen-tasks/8',
		badgeClass:
			'border-pen-tasks/40 bg-pen-tasks/8 text-pen-tasks dark:border-pen-tasks/35 dark:bg-pen-tasks/10 dark:text-pen-tasks'
	},
	3: {
		label: 'Medium',
		valueLabel: '3 - Medium',
		dotClass: 'bg-pen-journal dark:bg-pen-journal/8',
		badgeClass:
			'border-pen-journal/40 bg-pen-journal/8 text-pen-journal dark:border-pen-journal/35 dark:bg-pen-journal/10 dark:text-pen-journal'
	},
	4: {
		label: 'Low',
		valueLabel: '4 - Low',
		dotClass: 'bg-muted dark:bg-muted/65',
		badgeClass:
			'border-border/80 bg-muted/90 text-foreground dark:border-border/35 dark:bg-muted/10 dark:text-muted-foreground'
	}
};

export const taskPriorityOptions = [
	{ value: 1 as const, ...taskPriorityMeta[1] },
	{ value: 2 as const, ...taskPriorityMeta[2] },
	{ value: 3 as const, ...taskPriorityMeta[3] },
	{ value: 4 as const, ...taskPriorityMeta[4] }
];

const taskStateMeta: Record<TaskState, TaskStateMeta> = {
	new: {
		label: 'New',
		dotClass: 'bg-muted dark:bg-muted/70',
		badgeClass:
			'border-border/80 bg-muted/80 text-foreground dark:border-border/60 dark:bg-muted/15 dark:text-muted-foreground',
		headerClass:
			'border-pen-tasks/40 bg-muted/92 border-b-[3px] dark:border-pen-tasks/40 dark:bg-muted/82',
		emptyClass: 'border-border/70 bg-muted/55 dark:border-border/70 dark:bg-muted/45'
	},
	in_progress: {
		label: 'In Progress',
		dotClass: 'bg-pen-journal dark:bg-pen-journal/8',
		badgeClass:
			'border-pen-journal/40 bg-pen-journal/8 text-pen-journal dark:border-pen-journal/35 dark:bg-pen-journal/12 dark:text-pen-journal',
		headerClass:
			'border-pen-journal/40 bg-muted/92 border-b-[3px] dark:border-pen-journal/40 dark:bg-muted/82',
		emptyClass:
			'border-pen-journal/40 bg-pen-journal/8 dark:border-pen-journal/40 dark:bg-pen-journal/8'
	},
	on_hold: {
		label: 'On Hold',
		dotClass: 'bg-pen-warn dark:bg-pen-warn/8',
		badgeClass:
			'border-pen-warn/40 bg-pen-warn/8 text-pen-warn dark:border-pen-warn/35 dark:bg-pen-warn/12 dark:text-pen-warn',
		headerClass:
			'border-pen-warn/40 bg-muted/92 border-b-[3px] dark:border-pen-warn/40 dark:bg-muted/82',
		emptyClass: 'border-pen-warn/40 bg-pen-warn/8 dark:border-pen-warn/40 dark:bg-pen-warn/8'
	},
	blocked: {
		label: 'Blocked',
		dotClass: 'bg-destructive dark:bg-destructive/8',
		badgeClass:
			'border-destructive/40 bg-destructive/8 text-destructive dark:border-destructive/35 dark:bg-destructive/10 dark:text-destructive',
		headerClass:
			'border-destructive/40 bg-muted/92 border-b-[3px] dark:border-destructive/40 dark:bg-muted/82',
		emptyClass:
			'border-destructive/40 bg-destructive/8 dark:border-destructive/40 dark:bg-destructive/8'
	},
	done: {
		label: 'Done',
		dotClass: 'bg-pen-fitness dark:bg-pen-fitness/8',
		badgeClass:
			'border-pen-fitness/40 bg-pen-fitness/8 text-pen-fitness dark:border-pen-fitness/35 dark:bg-pen-fitness/10 dark:text-pen-fitness',
		headerClass:
			'border-pen-fitness/40 bg-muted/92 border-b-[3px] dark:border-pen-fitness/40 dark:bg-muted/82',
		emptyClass:
			'border-pen-fitness/40 bg-pen-fitness/8 dark:border-pen-fitness/40 dark:bg-pen-fitness/8'
	}
};

export const taskStateOptions = [
	{ value: 'new' as const, ...taskStateMeta.new },
	{ value: 'in_progress' as const, ...taskStateMeta.in_progress },
	{ value: 'on_hold' as const, ...taskStateMeta.on_hold },
	{ value: 'blocked' as const, ...taskStateMeta.blocked },
	{ value: 'done' as const, ...taskStateMeta.done }
];

const taskDueDateFilterMeta: Record<TaskDueDateFilter, TaskDueDateFilterMeta> = {
	overdue: {
		label: 'Overdue',
		valueLabel: 'Overdue',
		dotClass: 'bg-destructive dark:bg-destructive/8',
		badgeClass:
			'border-destructive/40 bg-destructive/8 text-destructive dark:border-destructive/35 dark:bg-destructive/10 dark:text-destructive'
	},
	today: {
		label: 'Due Today',
		valueLabel: 'Due Today',
		dotClass: 'bg-pen-tasks dark:bg-pen-tasks/8',
		badgeClass:
			'border-pen-tasks/40 bg-pen-tasks/8 text-pen-tasks dark:border-pen-tasks/35 dark:bg-pen-tasks/10 dark:text-pen-tasks'
	},
	upcoming: {
		label: 'Upcoming',
		valueLabel: 'Upcoming',
		dotClass: 'bg-pen-journal dark:bg-pen-journal/8',
		badgeClass:
			'border-pen-journal/40 bg-pen-journal/8 text-pen-journal dark:border-pen-journal/35 dark:bg-pen-journal/10 dark:text-pen-journal'
	}
};

export const taskDueDateFilterOptions = [
	{ value: 'overdue' as const, ...taskDueDateFilterMeta.overdue },
	{ value: 'today' as const, ...taskDueDateFilterMeta.today },
	{ value: 'upcoming' as const, ...taskDueDateFilterMeta.upcoming }
];

export function formatTaskDisplayId(taskNumber: number): string {
	return `SYN-${String(taskNumber).padStart(3, '0')}`;
}
