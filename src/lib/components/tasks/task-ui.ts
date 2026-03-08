import type { TaskState } from '$lib/schemas/task';

export type TaskPriority = 1 | 2 | 3 | 4;

export type TaskSummary = {
	id: string;
	title: string;
	description: string | null;
	state: TaskState;
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

export const taskPriorityMeta: Record<TaskPriority, TaskPriorityMeta> = {
	1: {
		label: 'Critical',
		valueLabel: '1 - Critical',
		dotClass: 'bg-red-600 dark:bg-red-400/65',
		badgeClass:
			'border-red-300/80 bg-red-100/80 text-red-700 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-200'
	},
	2: {
		label: 'High',
		valueLabel: '2 - High',
		dotClass: 'bg-orange-500 dark:bg-orange-300/65',
		badgeClass:
			'border-orange-300/80 bg-orange-100/80 text-orange-700 dark:border-orange-500/35 dark:bg-orange-500/10 dark:text-orange-200'
	},
	3: {
		label: 'Medium',
		valueLabel: '3 - Medium',
		dotClass: 'bg-blue-600 dark:bg-blue-400/65',
		badgeClass:
			'border-blue-300/80 bg-blue-100/80 text-blue-700 dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-200'
	},
	4: {
		label: 'Low',
		valueLabel: '4 - Low',
		dotClass: 'bg-slate-500 dark:bg-slate-400/65',
		badgeClass:
			'border-slate-300/80 bg-slate-100/90 text-slate-700 dark:border-slate-500/35 dark:bg-slate-500/10 dark:text-slate-300'
	}
};

export const taskPriorityOptions = [
	{ value: 1 as const, ...taskPriorityMeta[1] },
	{ value: 2 as const, ...taskPriorityMeta[2] },
	{ value: 3 as const, ...taskPriorityMeta[3] },
	{ value: 4 as const, ...taskPriorityMeta[4] }
];

export const taskStateMeta: Record<TaskState, TaskStateMeta> = {
	new: {
		label: 'New',
		dotClass: 'bg-slate-500 dark:bg-slate-400/70',
		badgeClass:
			'border-slate-300/80 bg-slate-200/80 text-slate-700 dark:border-slate-600/60 dark:bg-slate-600/15 dark:text-slate-300',
		headerClass:
			'border-slate-300/80 bg-slate-100/85 text-slate-700 dark:border-slate-600/60 dark:bg-slate-900/65 dark:text-slate-300',
		emptyClass: 'border-slate-300/70 bg-slate-100/55 dark:border-slate-700/70 dark:bg-slate-950/45'
	},
	in_progress: {
		label: 'In Progress',
		dotClass: 'bg-teal-500 dark:bg-teal-300/70',
		badgeClass:
			'border-teal-300/80 bg-teal-100/85 text-teal-700 dark:border-teal-500/35 dark:bg-teal-500/12 dark:text-teal-200',
		headerClass:
			'border-teal-300/80 bg-teal-100/80 text-teal-700 dark:border-teal-500/35 dark:bg-teal-950/60 dark:text-teal-200',
		emptyClass: 'border-teal-300/70 bg-teal-100/50 dark:border-teal-900/60 dark:bg-teal-950/35'
	},
	on_hold: {
		label: 'On Hold',
		dotClass: 'bg-amber-500 dark:bg-amber-300/70',
		badgeClass:
			'border-amber-300/80 bg-amber-100/85 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200',
		headerClass:
			'border-amber-300/80 bg-amber-100/80 text-amber-800 dark:border-amber-500/35 dark:bg-amber-950/55 dark:text-amber-200',
		emptyClass: 'border-amber-300/70 bg-amber-100/50 dark:border-amber-900/60 dark:bg-amber-950/35'
	},
	blocked: {
		label: 'Blocked',
		dotClass: 'bg-red-600 dark:bg-red-400/70',
		badgeClass:
			'border-red-300/80 bg-red-100/80 text-red-700 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-200',
		headerClass:
			'border-red-300/80 bg-red-100/75 text-red-700 dark:border-red-500/35 dark:bg-red-950/55 dark:text-red-200',
		emptyClass: 'border-red-300/70 bg-red-100/50 dark:border-red-900/60 dark:bg-red-950/35'
	},
	done: {
		label: 'Done',
		dotClass: 'bg-emerald-600 dark:bg-emerald-400/70',
		badgeClass:
			'border-emerald-300/80 bg-emerald-100/80 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200',
		headerClass:
			'border-emerald-300/80 bg-emerald-100/75 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-950/55 dark:text-emerald-200',
		emptyClass:
			'border-emerald-300/70 bg-emerald-100/50 dark:border-emerald-900/60 dark:bg-emerald-950/35'
	}
};

export const taskStateOptions = [
	{ value: 'new' as const, ...taskStateMeta.new },
	{ value: 'in_progress' as const, ...taskStateMeta.in_progress },
	{ value: 'on_hold' as const, ...taskStateMeta.on_hold },
	{ value: 'blocked' as const, ...taskStateMeta.blocked },
	{ value: 'done' as const, ...taskStateMeta.done }
];

export function getTaskStateLabel(state: TaskState): string {
	return taskStateMeta[state].label;
}
