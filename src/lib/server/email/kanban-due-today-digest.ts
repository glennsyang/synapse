import { formatDateMedium } from '$lib/utils/date';

export const KANBAN_DUE_TODAY_NOTIFICATION_TYPE = 'kanban_due_today_digest';
export const KANBAN_DUE_TODAY_DIGEST_TAGS = 'round_pushpin';

export type KanbanDueTodayTaskSummary = {
	id: string;
	taskNumber: number;
	title: string;
	priority: number;
	dueDate: string | null;
	state: string;
};

export function buildKanbanDueTodayDigestTitle(dateString: string): string {
	return `Synapse - Kanban Tasks Due Today for ${formatDateMedium(dateString)}`;
}

function getPriorityLabel(priority: number): string {
	const labels: Record<number, string> = {
		1: 'Highest priority',
		2: 'High priority',
		3: 'Medium priority',
		4: 'Low priority'
	};

	return labels[priority] ?? 'Priority task';
}

function toTaskBullet(task: KanbanDueTodayTaskSummary): string {
	return `• Task #${task.taskNumber}: ${task.title}`;
}

export function buildKanbanDueTodayDigestMessage(
	tasks: KanbanDueTodayTaskSummary[],
	dateString: string
): string {
	if (tasks.length === 0) {
		return `🗂️ No Kanban tasks are due today for ${formatDateMedium(dateString)}. Keep your momentum steady.`;
	}

	const taskList = tasks.map(toTaskBullet).join('\n');

	return `🗂️ These Kanban tasks are due today:\n\n${taskList}\n\nStay focused and keep your momentum moving.`;
}

export function buildKanbanDueTodayEmailHtml(
	name: string,
	tasks: KanbanDueTodayTaskSummary[],
	dateString: string
): string {
	const taskListMarkup = tasks
		.map(
			(task) => `
				<li style="margin-bottom: 16px; padding: 16px; border-radius: 12px; background: #ffffff; border: 1px solid #e5e7eb;">
					<div style="font-size: 14px; color: #6b7280; margin-bottom: 6px;">Task #${task.taskNumber}</div>
					<div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 6px;">${task.title}</div>
					<div style="font-size: 14px; color: #4b5563;">${getPriorityLabel(task.priority)}</div>
				</li>
			`
		)
		.join('');

	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Kanban Tasks Due Today</title>
		</head>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
				<h1 style="color: white; margin: 0; font-size: 28px;">🗂️ Kanban Tasks Due Today</h1>
			</div>
			<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
				<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
				<p style="font-size: 16px; margin-bottom: 20px;">
					Here is your Kanban due-today snapshot for <strong>${formatDateMedium(dateString)}</strong>.
				</p>
				<ul style="list-style: none; padding: 0; margin: 24px 0;">
					${taskListMarkup}
				</ul>
				<div style="background: #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<p style="margin: 0; font-size: 14px; color: #4b5563;">
						🎯 Clear the urgent work first, then use the rest of the day to create margin.
					</p>
				</div>
			</div>
			<div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
				<p>Synapse - Your Personal Second Brain</p>
			</div>
		</body>
		</html>
	`;
}
