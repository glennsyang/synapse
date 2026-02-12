/**
 * Date utilities for handling local dates without timezone conversion issues.
 *
 * The app stores dates as YYYY-MM-DD strings in the database.
 * When using `new Date('2026-02-09')`, JavaScript interprets it as UTC midnight,
 * which causes timezone shift issues when displaying in local time.
 *
 * These utilities ensure dates are parsed and displayed in the local timezone.
 */

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
export function parseLocalDate(dateString: string): Date {
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
 * Get today's date in YYYY-MM-DD format (local timezone).
 *
 * @returns Today's date in YYYY-MM-DD format
 *
 * @example
 * getTodayString() // "2026-02-11"
 */
export function getTodayString(): string {
	return new Date().toLocaleDateString('en-CA');
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
		month: 'short',
		day: 'numeric',
		year: 'numeric',
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
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
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
		hour: 'numeric',
		minute: '2-digit'
	});
}
