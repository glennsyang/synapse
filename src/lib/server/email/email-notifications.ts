/**
 * Email Notifications Cron Job
 *
 * Runs every 10 minutes to send scheduled reminders:
 * - Workout reminders (based on workout_reminders table)
 * - Meditation reminders (based on meditation_schedules table)
 * - Visit warnings (for people in yellow/red visit status)
 *
 * Logs all sent emails in email_notifications table to prevent duplicates.
 */

import { and, eq, sql } from 'drizzle-orm';

import { logger } from '$lib/utils/logger';

import getDb from '../db';

import {
	emailNotifications,
	meditationRoutines,
	meditationSchedules,
	people,
	user,
	visits,
	workoutReminders
} from './../db/schema';
import {
	sendMeditationReminderEmail,
	sendVisitWarningEmail,
	sendWorkoutReminderEmail
} from './index';
import {
	buildVisitWarningEntityId,
	buildVisitWarningSubject,
	formatVisitWarningDate,
	getVisitWarningStatus
} from './visit-warning-utils';

const db = getDb();

/**
 * Check if this reminder should fire today based on cadence and days_of_week
 */
function shouldFireToday(currentDay: number, cadence: string, daysOfWeek: string | null): boolean {
	if (cadence === 'daily') {
		return true;
	}
	if (cadence === 'weekly' && daysOfWeek) {
		try {
			const days: number[] = JSON.parse(daysOfWeek);
			return days.includes(currentDay);
		} catch (e) {
			logger.error('❌ Error parsing days_of_week:', e);
			return false;
		}
	}
	return false;
}

/**
 * Check if we already sent this notification today
 */
async function alreadySentToday(
	userId: string,
	notificationType: string,
	entityId: string
): Promise<boolean> {
	const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

	const existing = await db
		.select()
		.from(emailNotifications)
		.where(
			and(
				eq(emailNotifications.userId, userId),
				eq(emailNotifications.notificationType, notificationType),
				eq(emailNotifications.entityId, entityId),
				sql`DATE(${emailNotifications.sentAt}) = ${today}`
			)
		)
		.get();

	return !!existing;
}

/**
 * Log sent email notification
 */
async function logNotification(
	userId: string,
	notificationType: string,
	entityId: string,
	subject: string
): Promise<void> {
	await db.insert(emailNotifications).values({
		userId,
		notificationType,
		entityId,
		sentAt: new Date().toISOString(),
		emailSubject: subject
	});
}

/**
 * Process workout reminders
 */
async function processWorkoutReminders(
	currentDay: number,
	currentHour: string,
	currentMinute: string
): Promise<void> {
	logger.debug('\n💪 Processing workout reminders...');

	const reminders = await db
		.select({
			reminder: workoutReminders,
			user: user
		})
		.from(workoutReminders)
		.innerJoin(user, eq(workoutReminders.userId, user.id))
		.where(eq(workoutReminders.enabled, true))
		.all();

	logger.debug(`   Found ${reminders.length} enabled workout reminders`);

	let sentCount = 0;

	for (const { reminder, user: userData } of reminders) {
		// Check if should fire today
		if (!shouldFireToday(currentDay, reminder.cadence, reminder.daysOfWeek)) {
			continue;
		}

		// Check if time matches within a 10-minute window
		// Since cron runs every 10 minutes, this ensures we catch the reminder
		const [reminderHour, reminderMinute] = reminder.time.split(':');
		const reminderTimeInMinutes =
			Number.parseInt(reminderHour) * 60 + Number.parseInt(reminderMinute || '0');
		const currentTimeInMinutes = Number.parseInt(currentHour) * 60 + Number.parseInt(currentMinute);

		// Send if within 10 minutes of reminder time
		const timeDiff = Math.abs(currentTimeInMinutes - reminderTimeInMinutes);
		if (timeDiff > 10) {
			continue;
		}

		// Check if already sent today
		if (await alreadySentToday(userData.id, 'workout_reminder', reminder.id)) {
			logger.debug(`   ⏭️  Already sent to ${userData.email} today`);
			continue;
		}

		// Send email
		logger.debug(
			`   📧 Sending workout reminder to ${userData.email} (${reminder.workoutType} at ${reminder.time})`
		);

		try {
			await sendWorkoutReminderEmail(
				userData.email,
				userData.name,
				reminder.workoutType,
				reminder.time
			);

			await logNotification(
				userData.id,
				'workout_reminder',
				reminder.id,
				`Time for your ${reminder.workoutType} workout!`
			);

			sentCount++;
			logger.debug(`   ✅ Sent successfully`);
		} catch (error) {
			logger.error(`   ❌ Failed to send:`, { error });
		}
	}

	logger.debug(`   📊 Sent ${sentCount} workout reminders`);
}

/**
 * Process meditation reminders
 */
async function processMeditationReminders(
	currentDay: number,
	currentHour: string,
	currentMinute: string
): Promise<void> {
	logger.debug('\n🧘 Processing meditation reminders...');

	const schedules = await db
		.select({
			schedule: meditationSchedules,
			routine: meditationRoutines,
			user: user
		})
		.from(meditationSchedules)
		.innerJoin(meditationRoutines, eq(meditationSchedules.routineId, meditationRoutines.id))
		.innerJoin(user, eq(meditationSchedules.userId, user.id))
		.where(eq(meditationSchedules.enabled, true))
		.all();

	logger.debug(`   Found ${schedules.length} enabled meditation schedules`);

	let sentCount = 0;

	for (const { schedule, routine, user: userData } of schedules) {
		// Check if should fire today
		if (!shouldFireToday(currentDay, schedule.cadence, schedule.daysOfWeek)) {
			continue;
		}

		// Check if time matches within a 10-minute window
		// Since cron runs every 10 minutes, this ensures we catch the reminder
		const [scheduleHour, scheduleMinute] = schedule.time.split(':');
		const scheduleTimeInMinutes =
			Number.parseInt(scheduleHour) * 60 + Number.parseInt(scheduleMinute || '0');
		const currentTimeInMinutes = Number.parseInt(currentHour) * 60 + Number.parseInt(currentMinute);

		// Send if within 10 minutes of reminder time
		const timeDiff = Math.abs(currentTimeInMinutes - scheduleTimeInMinutes);
		if (timeDiff > 10) {
			continue;
		}

		// Check if already sent today
		if (await alreadySentToday(userData.id, 'meditation_reminder', schedule.id)) {
			logger.debug(`   ⏭️  Already sent to ${userData.email} today`);
			continue;
		}

		// Send email
		logger.debug(
			`   📧 Sending meditation reminder to ${userData.email} (${routine.title} at ${schedule.time})`
		);

		try {
			await sendMeditationReminderEmail(
				userData.email,
				userData.name,
				routine.title,
				schedule.time
			);

			await logNotification(
				userData.id,
				'meditation_reminder',
				schedule.id,
				`Time for your meditation practice`
			);

			sentCount++;
			logger.debug(`   ✅ Sent successfully`);
		} catch (error) {
			logger.error(`   ❌ Failed to send:`, { error });
		}
	}

	logger.debug(`   📊 Sent ${sentCount} meditation reminders`);
}

/**
 * Process visit warnings (people in yellow/red visit status)
 */
async function processVisitWarnings(): Promise<void> {
	logger.debug('\n👥 Processing visit warnings...');

	// Get all people with their last visit date
	const allPeople = await db
		.select({
			person: people,
			user: user
		})
		.from(people)
		.innerJoin(user, eq(people.userId, user.id))
		.all();

	logger.debug(`   Found ${allPeople.length} people to check`);

	let sentCount = 0;

	for (const { person, user: userData } of allPeople) {
		if (person.isExempt) {
			logger.debug(`   ⏭️  Skipping exempt person ${person.name}`);
			continue;
		}

		// Get last visit for this person
		const lastVisit = await db
			.select()
			.from(visits)
			.where(eq(visits.personId, person.id))
			.orderBy(sql`${visits.date} DESC`)
			.limit(1)
			.get();

		if (!lastVisit) {
			// No visits recorded yet, skip
			continue;
		}

		const warningStatus = getVisitWarningStatus(lastVisit.date);
		if (!warningStatus) {
			continue;
		}

		const formattedLastVisitDate = formatVisitWarningDate(lastVisit.date);
		const warningEntityId = buildVisitWarningEntityId(person.id, warningStatus);

		// Check if already sent a warning in the last 7 days
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const recentWarning = await db
			.select()
			.from(emailNotifications)
			.where(
				and(
					eq(emailNotifications.userId, userData.id),
					eq(emailNotifications.notificationType, 'visit_warning'),
					eq(emailNotifications.entityId, warningEntityId),
					sql`${emailNotifications.sentAt} >= ${sevenDaysAgo.toISOString()}`
				)
			)
			.get();

		if (recentWarning) {
			logger.debug(
				`   ⏭️  Already sent ${warningStatus} warning for ${person.name} in last 7 days`
			);
			continue;
		}

		// Send warning email
		logger.debug(
			`   📧 Sending ${warningStatus} visit warning to ${userData.email} (${person.name})`
		);

		try {
			await sendVisitWarningEmail(
				userData.email,
				userData.name,
				person.name,
				formattedLastVisitDate,
				warningStatus
			);

			await logNotification(
				userData.id,
				'visit_warning',
				warningEntityId,
				buildVisitWarningSubject(person.name, warningStatus)
			);

			sentCount++;
			logger.debug(`   ✅ Sent successfully`);
		} catch (error) {
			logger.error(`   ❌ Failed to send:`, { error });
		}
	}

	logger.debug(`   📊 Sent ${sentCount} visit warnings`);
}

/**
 * Main execution
 */
export async function runEmailNotifications() {
	logger.debug('🚀 Starting email notifications job run...');
	logger.debug(`📅 Current time (UTC): ${new Date().toISOString()}`);

	// Get current time info
	const now = new Date();

	// Convert UTC time to PST/PDT (automatically handles DST)
	const pstFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/Los_Angeles',
		hour: '2-digit',
		hour12: false,
		minute: '2-digit'
	});

	const pstTime = pstFormatter.format(now); // e.g., "07:30"
	const [currentHour, currentMinute] = pstTime.split(':');
	const currentTime = `${currentHour}:${currentMinute}`;

	// Get day of week in PST (important for weekly reminders)
	const pstDayFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/Los_Angeles',
		weekday: 'short'
	});
	const pstDayStr = pstDayFormatter.format(now);
	const dayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6
	};
	const currentDay: number = dayMap[pstDayStr] || 0;

	logger.debug(`⏰ Current time (PST/PDT): ${currentTime}, Day: ${currentDay}`);

	try {
		await processWorkoutReminders(currentDay, currentHour, currentMinute);
		await processMeditationReminders(currentDay, currentHour, currentMinute);
		await processVisitWarnings();

		logger.debug('\n✅ Email notifications cron job completed successfully!');
		process.exit(0);
	} catch (error) {
		logger.error('\n❌ Email notifications cron job failed:', { error });
		process.exit(1);
	}
}
