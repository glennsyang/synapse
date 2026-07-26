/**
 * Date utilities for handling local dates without timezone conversion issues.
 *
 * The app stores dates as YYYY-MM-DD strings in the database.
 * When using `new Date('2026-02-09')`, JavaScript interprets it as UTC midnight,
 * which causes timezone shift issues when displaying in local time.
 *
 * These utilities ensure dates are parsed and displayed in the local timezone.
 */

const APP_TIME_ZONE = 'America/Los_Angeles';

const appDateFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: APP_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

const appTodayLabelFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: APP_TIME_ZONE,
	weekday: 'long',
	month: 'long',
	day: 'numeric'
});

function formatDateParts(date: Date, formatter: Intl.DateTimeFormat): string {
	const parts = formatter.formatToParts(date);
	const year = parts.find((part) => part.type === 'year')?.value;
	const month = parts.find((part) => part.type === 'month')?.value;
	const day = parts.find((part) => part.type === 'day')?.value;

	if (!year || !month || !day) {
		throw new Error('Unable to format date parts');
	}

	return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string as a local date (not UTC).
 * Avoids timezone shift issues when displaying dates.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object in local timezone
 *
 * @example
 * parseLocalDate('2026-02-09') // February 9, 2026 in local timezone
 */
function parseLocalDate(dateString: string): Date {
	const [year, month, day] = dateString.split('-').map(Number);
	return new Date(year, month - 1, day);
}

/**
 * Format a YYYY-MM-DD date string for long display.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Monday, February 9, 2026")
 *
 * @example
 * formatDateLong('2026-02-09') // "Monday, February 9, 2026"
 */
export function formatDateLong(dateString: string): string {
	const date = parseLocalDate(dateString);
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Format a YYYY-MM-DD date string for medium display.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Sat, Feb 9")
 *
 * @example
 * formatDateMedium('2026-02-09') // "Sat, Feb 9"
 */
export function formatDateMedium(dateString: string): string {
	const date = parseLocalDate(dateString);
	return date.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Format a YYYY-MM-DD date string for short display.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Feb 9, 2026")
 *
 * @example
 * formatDateShort('2026-02-09') // "Feb 9, 2026"
 */
export function formatDateShort(dateString: string): string {
	const date = parseLocalDate(dateString);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Format a YYYY-MM-DD date string as month and day only, with no year or weekday.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Feb 9")
 *
 * @example
 * formatMonthDay('2026-02-09') // "Feb 9"
 */
export function formatMonthDay(dateString: string): string {
	const date = parseLocalDate(dateString);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric'
	});
}

type DateDisplayFormat = 'long' | 'medium' | 'short' | 'monthDay';

function formatDateByStyle(dateString: string, format: DateDisplayFormat): string {
	switch (format) {
		case 'long':
			return formatDateLong(dateString);
		case 'medium':
			return formatDateMedium(dateString);
		case 'short':
			return formatDateShort(dateString);
		case 'monthDay':
			return formatMonthDay(dateString);
	}
}

export function getRelativeDateLabel(
	dateString: string,
	today: string = getTodayString()
): 'Yesterday' | 'Today' | 'Tomorrow' | null {
	switch (calendarDaysBetween(today, dateString)) {
		case -1:
			return 'Yesterday';
		case 0:
			return 'Today';
		case 1:
			return 'Tomorrow';
		default:
			return null;
	}
}

interface HeuristicDateOptions {
	today?: string;
	fallback?: DateDisplayFormat;
	includeAbsoluteDate?: boolean;
}

export function formatDateHeuristic(
	dateString: string,
	{
		today = getTodayString(),
		fallback = 'medium',
		includeAbsoluteDate = false
	}: HeuristicDateOptions = {}
): string {
	const relativeLabel = getRelativeDateLabel(dateString, today);

	if (!relativeLabel) {
		return formatDateByStyle(dateString, fallback);
	}

	if (includeAbsoluteDate) {
		return `${relativeLabel} · ${formatDateByStyle(dateString, fallback)}`;
	}

	return relativeLabel;
}

/**
 * Format today's date as a long display label using the app timezone.
 *
 * @param referenceDate - Date to format (defaults to now)
 * @returns Formatted label (e.g., "Monday, May 26")
 *
 * @example
 * formatTodayLabel() // "Monday, May 26"
 */
export function formatTodayLabel(referenceDate: Date = new Date()): string {
	return appTodayLabelFormatter.format(referenceDate);
}

/**
 * Get today's date in YYYY-MM-DD format using the app timezone.
 *
 * @returns Today's date in YYYY-MM-DD format
 *
 * @example
 * getTodayString() // "2026-02-11"
 */
export function getTodayString(referenceDate: Date = new Date()): string {
	return formatDateParts(referenceDate, appDateFormatter);
}

export function parseLocalDateString(dateString: string): Date {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

	if (!match) {
		throw new Error(`Invalid local date string: ${dateString}`);
	}

	const [, year, month, day] = match;
	return new Date(Number(year), Number(month) - 1, Number(day));
}

export function toLocalDateString(date: Date): string {
	return date.toLocaleDateString('en-CA');
}

export function addDaysToDateString(dateString: string, days: number): string {
	const date = parseLocalDateString(dateString);
	date.setDate(date.getDate() + days);
	return toLocalDateString(date);
}

export function getDateRange(startDate: string, endDate: string): string[] {
	const range: string[] = [];
	let currentDate = startDate;

	while (currentDate <= endDate) {
		range.push(currentDate);
		currentDate = addDaysToDateString(currentDate, 1);
	}

	return range;
}

export function getStartOfMonth(dateString: string = getTodayString()): string {
	const date = parseLocalDateString(dateString);
	date.setDate(1);
	return toLocalDateString(date);
}

export function getStartOfQuarter(dateString: string = getTodayString()): string {
	const date = parseLocalDateString(dateString);
	const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
	date.setMonth(quarterStartMonth, 1);
	return toLocalDateString(date);
}

export function getStartOfWeek(dateString: string = getTodayString()): string {
	const date = parseLocalDateString(dateString);
	const mondayOffset = (date.getDay() + 6) % 7;
	date.setDate(date.getDate() - mondayOffset);
	return toLocalDateString(date);
}

export function getWeekDates(weekStart: string): string[] {
	return Array.from({ length: 7 }, (_, index) => addDaysToDateString(weekStart, index));
}

export function getRollingDateRange(endDate: string, dayCount: number): string[] {
	return Array.from({ length: dayCount }, (_, index) =>
		addDaysToDateString(endDate, index - dayCount + 1)
	);
}

/**
 * Format an ISO timestamp for display with date and time.
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted timestamp (e.g., "Feb 9, 2026, 2:30 PM")
 *
 * @example
 * formatTimestampLong('2026-02-09T14:30:00.000Z') // "Feb 9, 2026, 2:30 PM"
 */
export function formatTimestampLong(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleString('en-US', {
		timeZone: APP_TIME_ZONE,
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

/**
 * Format an ISO timestamp for display with date and time.
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted timestamp (e.g., "Sat, Feb 9, 2:30 PM")
 *
 * @example
 * formatTimestampMedium('2026-02-09T14:30:00.000Z') // "Sat, Feb 9, 2:30 PM"
 */
export function formatTimestampMedium(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleString('en-US', {
		timeZone: APP_TIME_ZONE,
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

/**
 * Format an ISO timestamp for short display with date only.
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted date (e.g., "Feb 9, 2026")
 *
 * @example
 * formatTimestampShort('2026-02-09T14:30:00.000Z') // "Feb 9, 2026"
 */
export function formatTimestampShort(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleDateString('en-US', {
		timeZone: APP_TIME_ZONE,
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function formatTimestampDateHeuristic(
	timestamp: string,
	options: HeuristicDateOptions = {}
): string {
	const dateString = formatDateParts(new Date(timestamp), appDateFormatter);
	return formatDateHeuristic(dateString, options);
}

/**
 * Format just the time portion of an ISO timestamp.
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted time (e.g., "2:30 PM")
 *
 * @example
 * formatTimeFromTimestamp('2026-02-09T14:30:00.000Z') // "2:30 PM"
 */
export function formatTimeFromTimestamp(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleTimeString('en-US', {
		timeZone: APP_TIME_ZONE,
		hour: 'numeric',
		minute: '2-digit'
	});
}

/**
 * Format a time for display as 12-hour time with AM/PM.
 *
 * @param timeString - Time in HH:mm format (24-hour)
 * @returns Formatted time (e.g., "2:30 PM")
 *
 * @example
 * formatTime12Hour('14:30') // "2:30 PM"
 */
export function formatTime12Hour(timeString: string): string {
	const [hour, minute] = timeString.split(':').map(Number);
	const date = new Date();
	date.setHours(hour, minute);
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit'
	});
}

type DateUrgencyStatus = 'overdue' | 'today' | 'upcoming';

/**
 * Categorize a local YYYY-MM-DD date relative to today.
 * String comparison is safe because both values use the same sortable date format.
 */
export function getDateUrgencyStatus(
	dateString: string | null | undefined,
	today: string = getTodayString()
): DateUrgencyStatus | null {
	if (!dateString) {
		return null;
	}

	if (dateString < today) {
		return 'overdue';
	}

	if (dateString === today) {
		return 'today';
	}

	return 'upcoming';
}

/**
 * Return the ISO day-of-week index (0 = Monday, 6 = Sunday) for a YYYY-MM-DD date string.
 * Uses UTC arithmetic to avoid server-timezone shifts.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Day index where 0 is Monday and 6 is Sunday
 *
 * @example
 * getISODayOfWeek('2026-05-25') // 0 (Monday)
 */
export function getISODayOfWeek(dateString: string): number {
	const [year, month, day] = dateString.split('-').map(Number);
	return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/**
 * Calculate the number of calendar days between two YYYY-MM-DD date strings.
 * Uses UTC arithmetic to avoid DST-induced off-by-one errors.
 * Returns a negative number if endDate is before startDate.
 *
 * @param startDate - Earlier date in YYYY-MM-DD format
 * @param endDate - Later date in YYYY-MM-DD format
 * @returns Number of calendar days from startDate to endDate
 *
 * @example
 * calendarDaysBetween('2026-05-20', '2026-05-26') // 6
 */
export function calendarDaysBetween(startDate: string, endDate: string): number {
	const MS_PER_DAY = 1000 * 60 * 60 * 24;
	const [sy, sm, sd] = startDate.split('-').map(Number);
	const [ey, em, ed] = endDate.split('-').map(Number);
	return Math.floor((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / MS_PER_DAY);
}

export const daysOfWeek = [
	{ id: 0, name: 'Sunday', shortName: 'Sun' },
	{ id: 1, name: 'Monday', shortName: 'Mon' },
	{ id: 2, name: 'Tuesday', shortName: 'Tue' },
	{ id: 3, name: 'Wednesday', shortName: 'Wed' },
	{ id: 4, name: 'Thursday', shortName: 'Thu' },
	{ id: 5, name: 'Friday', shortName: 'Fri' },
	{ id: 6, name: 'Saturday', shortName: 'Sat' }
];
