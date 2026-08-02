import { calendarDaysBetween, getTodayString } from '$lib/utils/date';

/**
 * Visit status types
 */
export type VisitStatus = 'green' | 'yellow' | 'red' | 'scheduled' | 'none' | 'exempt';

export interface VisitStatusThresholds {
	recentToOverdueDays: number;
	overdueToCriticalDays: number;
}

export const DEFAULT_VISIT_STATUS_THRESHOLDS: VisitStatusThresholds = {
	recentToOverdueDays: 273,
	overdueToCriticalDays: 365
};

const VISIT_STATUS_MONTH_DAYS = 365 / 12;

const VISIT_STATUS_ORDER: VisitStatus[] = ['red', 'yellow', 'green', 'scheduled', 'none', 'exempt'];

/**
 * Person with visit status information
 */
export interface PersonWithStatus {
	id: string;
	name: string;
	isExempt: boolean;
	nextFollowUpDate: string | null;
	lastVisit: {
		date: string;
		companions: string[] | null;
	} | null;
	status: VisitStatus;
	daysSinceLastVisit: number | null;
	daysUntilStatusChange: number | null;
	createdAt: string;
}

function isValidThresholdDay(value: number): boolean {
	return Number.isInteger(value) && Number.isFinite(value) && value > 0;
}

export function normalizeVisitStatusThresholds(
	thresholds?: Partial<VisitStatusThresholds> | null
): VisitStatusThresholds {
	const recentCandidate = Math.round(Number(thresholds?.recentToOverdueDays));
	const criticalCandidate = Math.round(Number(thresholds?.overdueToCriticalDays));

	const recentToOverdueDays = isValidThresholdDay(recentCandidate)
		? recentCandidate
		: DEFAULT_VISIT_STATUS_THRESHOLDS.recentToOverdueDays;
	const overdueToCriticalDays = isValidThresholdDay(criticalCandidate)
		? criticalCandidate
		: DEFAULT_VISIT_STATUS_THRESHOLDS.overdueToCriticalDays;

	if (overdueToCriticalDays <= recentToOverdueDays) {
		return { ...DEFAULT_VISIT_STATUS_THRESHOLDS };
	}

	return {
		recentToOverdueDays,
		overdueToCriticalDays
	};
}

export function convertVisitThresholdToDays(value: number, unit: 'days' | 'months'): number {
	if (!Number.isFinite(value)) {
		return Number.NaN;
	}

	if (unit === 'months') {
		return Math.round(value * VISIT_STATUS_MONTH_DAYS);
	}

	return Math.round(value);
}

export function convertVisitThresholdFromDays(days: number, unit: 'days' | 'months'): number {
	if (unit === 'months') {
		return Number((days / VISIT_STATUS_MONTH_DAYS).toFixed(2));
	}

	return days;
}

/**
 * Calculate visit status based on days since last visit
 * - No visits: 'none'
 * - 0–<9 months (0-273 days): 'green'
 * - 9–<12 months (274-364 days): 'yellow'
 * - ≥12 months (365+ days): 'red'
 */
export function calculateVisitStatus(
	lastVisitDate: string | null,
	today: string = getTodayString(),
	thresholds?: Partial<VisitStatusThresholds> | null
): {
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

	const daysSince = calendarDaysBetween(lastVisitDate, today);
	const { recentToOverdueDays, overdueToCriticalDays } = normalizeVisitStatusThresholds(thresholds);

	let status: VisitStatus;
	let daysUntilChange: number | null;

	if (daysSince < recentToOverdueDays) {
		status = 'green';
		daysUntilChange = recentToOverdueDays - daysSince;
	} else if (daysSince < overdueToCriticalDays) {
		status = 'yellow';
		daysUntilChange = overdueToCriticalDays - daysSince;
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

export function calculatePersonVisitStatus(
	lastVisitDate: string | null,
	isExempt: boolean,
	latestFollowUpDate: string | null = null,
	today: string = getTodayString(),
	thresholds?: Partial<VisitStatusThresholds> | null
): {
	status: VisitStatus;
	daysSinceLastVisit: number | null;
	daysUntilStatusChange: number | null;
} {
	const baseStatus = calculateVisitStatus(lastVisitDate, today, thresholds);
	const normalizedFollowUpDate = latestFollowUpDate ? latestFollowUpDate.split('T')[0] : null;
	const hasScheduledFollowUp = normalizedFollowUpDate !== null && normalizedFollowUpDate >= today;

	if (hasScheduledFollowUp) {
		return {
			status: 'scheduled',
			daysSinceLastVisit: baseStatus.daysSinceLastVisit,
			daysUntilStatusChange: null
		};
	}

	if (!isExempt) {
		return baseStatus;
	}

	return {
		status: 'exempt',
		daysSinceLastVisit: baseStatus.daysSinceLastVisit,
		daysUntilStatusChange: null
	};
}

/**
 * The follow-up date that should drive a person's "scheduled" status.
 * Once a person has at least one logged visit, that visit's own follow-up
 * date is authoritative. Otherwise, fall back to the person-level scheduled
 * visit date (set without ever logging a visit).
 */
export function getEffectiveFollowUpDate(
	hasVisits: boolean,
	latestVisitFollowUpDate: string | null | undefined,
	personScheduledVisitDate: string | null | undefined
): string | null {
	if (hasVisits) {
		return latestVisitFollowUpDate ?? null;
	}

	return personScheduledVisitDate ?? null;
}

export function getStatusPriority(status: VisitStatus): number {
	return VISIT_STATUS_ORDER.indexOf(status) + 1;
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
		case 'scheduled':
			return 'Scheduled';
		case 'none':
			return 'No Visits';
		case 'exempt':
			return 'Exempt';
	}
}
