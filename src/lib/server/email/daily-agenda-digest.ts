import type { DailyAgendaEntry } from '$lib/types';
import { formatDateMedium } from '$lib/utils/date';

export const DAILY_AGENDA_DIGEST_TIME = '06:00';
// Allow delivery any time after 6:00 AM PT through the end of the same day.
export const DAILY_AGENDA_DIGEST_WINDOW_MINUTES = 1079;
export const DAILY_AGENDA_DIGEST_NOTIFICATION_TYPE = 'daily_agenda_digest';
export const DAILY_AGENDA_DIGEST_TAGS = 'date,point_right';

export const DAILY_MOTIVATION_PHRASES = [
	'One focused day can change your whole week!',
	'Progress beats perfection every single time!',
	'You are closer than you were yesterday!',
	'Show up now and your future self will thank you!',
	'Momentum starts with the very next task!',
	'Win the morning and let the day follow!',
	'Small actions create meaningful change!',
	'Consistency is your secret superpower!'
] as const;

function parseTimeToMinutes(time: string): number {
	const [hourValue, minuteValue] = time.split(':');
	const hour = Number.parseInt(hourValue ?? '', 10);
	const minute = Number.parseInt(minuteValue ?? '', 10);

	if (Number.isNaN(hour) || Number.isNaN(minute)) {
		throw new TypeError(`Invalid time string: ${time}`);
	}

	return hour * 60 + minute;
}

export function isWithinDailyDigestWindow(
	currentHour: string,
	currentMinute: string,
	targetTime = DAILY_AGENDA_DIGEST_TIME,
	windowMinutes = DAILY_AGENDA_DIGEST_WINDOW_MINUTES
): boolean {
	const currentMinutes = parseTimeToMinutes(`${currentHour}:${currentMinute}`);
	const targetMinutes = parseTimeToMinutes(targetTime);

	return currentMinutes >= targetMinutes && currentMinutes <= targetMinutes + windowMinutes;
}

export function getDailyMotivationPhrase(
	dateString: string,
	phrases: readonly string[] = DAILY_MOTIVATION_PHRASES
): string {
	if (phrases.length === 0) {
		return 'Keep moving forward, one task at a time';
	}

	const normalizedDate = dateString.replaceAll('-', '');
	const numericDate = Number.parseInt(normalizedDate, 10);
	const index = Number.isNaN(numericDate) ? 0 : numericDate % phrases.length;

	return phrases[index] ?? phrases[0] ?? 'Keep moving forward, one task at a time';
}

export function buildDailyAgendaDigestTitle(dateString: string): string {
	return `Synapse - Daily Agenda for ${formatDateMedium(dateString)}`;
}

function toTaskBullet(entry: DailyAgendaEntry): string {
	const statusEmoji = entry.completed ? '✅' : '⚪';
	return `${statusEmoji} ${entry.title}`;
}

export function buildDailyAgendaDigestMessage(
	entries: DailyAgendaEntry[],
	dateString: string
): string {
	const listLines =
		entries.length > 0
			? entries.map(toTaskBullet)
			: ['🌟 No agenda tasks today - enjoy the momentum and make it count!'];

	const motivationalPhrase = getDailyMotivationPhrase(dateString);
	const taskList = listLines.join(`
`);

	return `📝 Today's agenda:

${taskList}

🚀 ${motivationalPhrase}`;
}
