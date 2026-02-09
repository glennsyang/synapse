/**
 * Visit status types
 */
export type VisitStatus = 'green' | 'yellow' | 'red' | 'none';

/**
 * Person with visit status information
 */
export interface PersonWithStatus {
	id: string;
	name: string;
	lastVisit: {
		date: string;
		companions: string[] | null;
	} | null;
	status: VisitStatus;
	daysSinceLastVisit: number | null;
	daysUntilStatusChange: number | null;
	createdAt: string;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
	const MS_PER_DAY = 1000 * 60 * 60 * 24;
	const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
	const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
	return Math.floor((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Calculate visit status based on days since last visit
 * - No visits: 'none'
 * - 0–<9 months (0-273 days): 'green'
 * - 9–<12 months (274-364 days): 'yellow'
 * - ≥12 months (365+ days): 'red'
 */
export function calculateVisitStatus(lastVisitDate: string | null): {
	status: VisitStatus;
	daysSinceLastVisit: number | null;
	daysUntilStatusChange: number | null;
} {
	if (!lastVisitDate) {
		return {
			status: 'none',
			daysSinceLastVisit: null,
			daysUntilStatusChange: null
		};
	}

	const today = new Date();
	const visitDate = new Date(lastVisitDate);
	const daysSince = daysBetween(visitDate, today);

	const NINE_MONTHS = 273; // ~9 months
	const TWELVE_MONTHS = 365; // ~12 months

	let status: VisitStatus;
	let daysUntilChange: number | null;

	if (daysSince < NINE_MONTHS) {
		status = 'green';
		daysUntilChange = NINE_MONTHS - daysSince;
	} else if (daysSince < TWELVE_MONTHS) {
		status = 'yellow';
		daysUntilChange = TWELVE_MONTHS - daysSince;
	} else {
		status = 'red';
		daysUntilChange = null; // Already at final status
	}

	return {
		status,
		daysSinceLastVisit: daysSince,
		daysUntilStatusChange: daysUntilChange
	};
}

/**
 * Get status badge color class for Tailwind
 */
export function getStatusColor(status: VisitStatus): string {
	switch (status) {
		case 'green':
			return 'bg-green-500';
		case 'yellow':
			return 'bg-yellow-500';
		case 'red':
			return 'bg-red-500';
		case 'none':
			return 'bg-gray-400';
	}
}

/**
 * Get status label text
 */
export function getStatusLabel(status: VisitStatus): string {
	switch (status) {
		case 'green':
			return 'Recent';
		case 'yellow':
			return 'Overdue';
		case 'red':
			return 'Critical';
		case 'none':
			return 'No Visits';
	}
}
