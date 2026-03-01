import { calculatePersonVisitStatus } from '$lib/utils/visit-status';

export type VisitWarningStatus = 'yellow' | 'critical';

const visitWarningDateFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'UTC',
	month: 'long',
	day: 'numeric',
	year: 'numeric'
});

export function getVisitWarningStatus(
	lastVisitDate: string,
	latestFollowUpDate: string | null = null
): VisitWarningStatus | null {
	const { status } = calculatePersonVisitStatus(lastVisitDate, false, latestFollowUpDate);

	if (status === 'yellow') {
		return 'yellow';
	}

	if (status === 'red') {
		return 'critical';
	}

	return null;
}

export function formatVisitWarningDate(lastVisitDate: string): string {
	const [year, month, day] = lastVisitDate.split('T')[0].split('-').map(Number);
	return visitWarningDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

export function buildVisitWarningEntityId(
	personId: string,
	warningStatus: VisitWarningStatus
): string {
	return `${personId}:${warningStatus}`;
}

export function buildVisitWarningSubject(
	personName: string,
	warningStatus: VisitWarningStatus
): string {
	if (warningStatus === 'critical') {
		return `Status: Critical Warning for ${personName}`;
	}

	return `Status: Yellow Warning for ${personName}`;
}
