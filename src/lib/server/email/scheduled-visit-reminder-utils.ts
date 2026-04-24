const reminderDateFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'UTC',
	month: 'long',
	day: 'numeric',
	year: 'numeric'
});

export const SCHEDULED_VISIT_REMINDER_NOTIFICATION_TYPE = 'scheduled_visit_reminder';

/**
 * Returns the date string (YYYY-MM-DD) that is `daysAhead` days from the given date.
 */
export function getDateDaysAhead(fromDate: Date, daysAhead: number): string {
	const d = new Date(fromDate);
	d.setDate(d.getDate() + daysAhead);
	return d.toISOString().split('T')[0];
}

export function formatReminderDate(dateString: string): string {
	const [year, month, day] = dateString.split('-').map(Number);
	return reminderDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

export function buildScheduledVisitReminderEntityId(visitId: string): string {
	return `scheduled_visit:${visitId}`;
}

export function buildScheduledVisitReminderSubject(personName: string): string {
	return `[Synapse] 📅 Upcoming visit with ${personName} in one week`;
}
