/**
 * Email Notifications Cron Job
 *
 * Runs every 10 minutes to send scheduled reminders:
 * - Workout reminders (based on workout_reminders table)
 * - Meditation reminders (based on meditation_schedules table)
 * - Visit warnings (for people in yellow/red visit status)
 * - Daily agenda digests at 6:00 AM PT (based on daily_agenda_entries)
 * - Tasks due-today digests at 6:00 AM PT (based on tasks.due_date)
 *
 * Logs all sent emails in email_notifications table to prevent duplicates.
 */

import { getVisitStatusThresholdsByUserIds } from '$lib/server/visit-status-settings';
import { getTodayString } from '$lib/utils/date';
import { logger } from '$lib/utils/logger';
import { and, eq, sql } from 'drizzle-orm';

import { loadDailyAgendaEntriesForDate } from '../daily-agenda';
import { getDb } from '../db';
import { sendReminderAlerts } from '../notifications';
import {
	emailNotifications,
	meditationRoutines,
	meditationSchedules,
	people,
	tasks,
	user,
	visits,
	workoutReminders
} from './../db/schema';
import {
	buildDailyAgendaDigestMessage,
	buildDailyAgendaDigestTitle,
	DAILY_AGENDA_DIGEST_NOTIFICATION_TYPE,
	DAILY_AGENDA_DIGEST_TAGS,
	DAILY_AGENDA_DIGEST_TIME,
	isWithinDailyDigestWindow
} from './daily-agenda-digest';
import {
	getNotificationTag,
	sendMeditationReminderEmail,
	sendScheduledVisitReminderEmail,
	sendTasksDueTodayEmail,
	sendVisitTodayReminderEmail,
	sendVisitWarningEmail,
	sendWorkoutReminderEmail
} from './index';
import {
	buildScheduledVisitReminderEntityId,
	buildScheduledVisitReminderSubject,
	buildVisitTodayReminderEntityId,
	buildVisitTodayReminderSubject,
	formatReminderDate,
	getDateDaysAhead,
	SCHEDULED_VISIT_REMINDER_NOTIFICATION_TYPE,
	VISIT_TODAY_REMINDER_NOTIFICATION_TYPE
} from './scheduled-visit-reminder-utils';
import {
	buildTasksDueTodayDigestMessage,
	buildTasksDueTodayDigestTitle,
	TASKS_DUE_TODAY_DIGEST_TAGS,
	TASKS_DUE_TODAY_NOTIFICATION_TYPE,
	type TasksDueTodayTaskSummary
} from './tasks-due-today-digest';
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

	const existing = db
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
 * Send a short phone notification alongside reminder emails
 */
async function sendReminderNotification(
	message: string,
	title: string,
	tags: string,
	priority = 3
): Promise<void> {
	const sent = await sendReminderAlerts(message, title, priority, tags);

	if (!sent) {
		logger.warn('Reminder notification could not be delivered', {
			title,
			message
		});
	}
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

	const reminders = db
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

		// Send if reminder time has already passed today.
		// Using >= instead of a fixed window because GitHub Actions cron scheduling
		// is not guaranteed to run at exact intervals — it can be significantly delayed.
		// Duplicate sends are prevented by the alreadySentToday check below.
		const [reminderHour, reminderMinute] = reminder.time.split(':');
		const reminderTimeInMinutes =
			Number.parseInt(reminderHour, 10) * 60 + Number.parseInt(reminderMinute || '0', 10);
		const currentTimeInMinutes =
			Number.parseInt(currentHour, 10) * 60 + Number.parseInt(currentMinute, 10);

		if (currentTimeInMinutes < reminderTimeInMinutes) {
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

			await sendReminderNotification(
				`You scheduled a ${reminder.workoutType} workout for today.`,
				'Workout Reminder',
				getNotificationTag(reminder.workoutType)
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

	const schedules = db
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

		// Send if reminder time has already passed today.
		// Using >= instead of a fixed window because GitHub Actions cron scheduling
		// is not guaranteed to run at exact intervals — it can be significantly delayed.
		// Duplicate sends are prevented by the alreadySentToday check below.
		const [scheduleHour, scheduleMinute] = schedule.time.split(':');
		const scheduleTimeInMinutes =
			Number.parseInt(scheduleHour, 10) * 60 + Number.parseInt(scheduleMinute || '0', 10);
		const currentTimeInMinutes =
			Number.parseInt(currentHour, 10) * 60 + Number.parseInt(currentMinute, 10);

		if (currentTimeInMinutes < scheduleTimeInMinutes) {
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

			await sendReminderNotification(
				`Meditation reminder: ${routine.title} at ${schedule.time}.`,
				'Meditation Reminder',
				'lotus_position_man'
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
	const allPeople = db
		.select({
			person: people,
			user: user
		})
		.from(people)
		.innerJoin(user, eq(people.userId, user.id))
		.where(eq(people.isArchived, false))
		.all();

	logger.debug(`   Found ${allPeople.length} people to check`);
	const visitThresholdsByUserId = await getVisitStatusThresholdsByUserIds(
		allPeople.map(({ user: userData }) => userData.id),
		db
	);

	let sentCount = 0;

	for (const { person, user: userData } of allPeople) {
		if (person.isExempt) {
			logger.debug(`   ⏭️  Skipping exempt person ${person.name}`);
			continue;
		}

		// Get last visit for this person
		const lastVisit = db
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

		const warningStatus = getVisitWarningStatus(
			lastVisit.date,
			lastVisit.followUpDate,
			visitThresholdsByUserId.get(userData.id)
		);
		if (!warningStatus) {
			continue;
		}

		const formattedLastVisitDate = formatVisitWarningDate(lastVisit.date);
		const warningEntityId = buildVisitWarningEntityId(person.id, warningStatus);

		// Check if already sent a warning in the last 7 days
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const recentWarning = db
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

			const visitNotificationMessage =
				warningStatus === 'critical'
					? `Critical visit warning: ${person.name} needs follow-up.`
					: `Visit warning: ${person.name} is due for follow-up.`;

			await sendReminderNotification(
				visitNotificationMessage,
				'Synapse - Visit Warning',
				'busts_in_silhouette',
				warningStatus === 'critical' ? 4 : 3
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

async function alreadySentDailyAgendaDigest(userId: string, dateString: string): Promise<boolean> {
	const existing = db
		.select({ id: emailNotifications.id })
		.from(emailNotifications)
		.where(
			and(
				eq(emailNotifications.userId, userId),
				eq(emailNotifications.notificationType, DAILY_AGENDA_DIGEST_NOTIFICATION_TYPE),
				eq(emailNotifications.entityId, dateString)
			)
		)
		.get();

	return !!existing;
}

async function alreadySentTasksDueTodayDigest(
	userId: string,
	dateString: string
): Promise<boolean> {
	const existing = db
		.select({ id: emailNotifications.id })
		.from(emailNotifications)
		.where(
			and(
				eq(emailNotifications.userId, userId),
				eq(emailNotifications.notificationType, TASKS_DUE_TODAY_NOTIFICATION_TYPE),
				eq(emailNotifications.entityId, dateString)
			)
		)
		.get();

	return !!existing;
}

async function loadTasksDueToday(
	userId: string,
	dateString: string
): Promise<TasksDueTodayTaskSummary[]> {
	const dueTodayTasks = await db.query.tasks.findMany({
		where: and(
			eq(tasks.userId, userId),
			eq(tasks.dueDate, dateString),
			sql`${tasks.state} != 'done'`
		),
		columns: {
			id: true,
			taskNumber: true,
			title: true,
			priority: true,
			dueDate: true,
			state: true
		},
		orderBy: [tasks.priority, tasks.taskNumber]
	});

	return dueTodayTasks.map((task) => ({
		id: task.id,
		taskNumber: task.taskNumber,
		title: task.title,
		priority: task.priority,
		dueDate: task.dueDate,
		state: task.state
	}));
}

/**
 * Process daily agenda digest notifications
 */
async function processDailyAgendaDigests(
	currentHour: string,
	currentMinute: string,
	todayPacific: string
): Promise<void> {
	logger.debug('\n🗓️ Processing daily agenda digests...');

	if (!isWithinDailyDigestWindow(currentHour, currentMinute)) {
		logger.debug(`   ⏭️  Before daily digest start time (${DAILY_AGENDA_DIGEST_TIME} PT)`);
		return;
	}

	const allUsers = db
		.select({
			id: user.id,
			email: user.email,
			name: user.name
		})
		.from(user)
		.all();

	logger.debug(`   Found ${allUsers.length} users for daily agenda digests`);

	let sentCount = 0;

	for (const userData of allUsers) {
		if (await alreadySentDailyAgendaDigest(userData.id, todayPacific)) {
			logger.debug(`   ⏭️  Already sent daily digest to ${userData.email} for ${todayPacific}`);
			continue;
		}

		const entries = await loadDailyAgendaEntriesForDate(userData.id, todayPacific);
		const title = buildDailyAgendaDigestTitle(todayPacific);
		const message = buildDailyAgendaDigestMessage(entries, todayPacific);

		logger.debug(
			`   📲 Sending daily agenda digest to ${userData.email} (${entries.length} tasks)`
		);

		try {
			await sendReminderNotification(message, title, DAILY_AGENDA_DIGEST_TAGS);

			await logNotification(
				userData.id,
				DAILY_AGENDA_DIGEST_NOTIFICATION_TYPE,
				todayPacific,
				title
			);

			sentCount++;
			logger.debug('   ✅ Sent successfully');
		} catch (error) {
			logger.error('   ❌ Failed to send daily agenda digest', {
				error,
				userId: userData.id
			});
		}
	}

	logger.debug(`   📊 Sent ${sentCount} daily agenda digests`);
}

async function processTasksDueTodayDigests(
	currentHour: string,
	currentMinute: string,
	todayPacific: string
): Promise<void> {
	logger.debug('\n🗂️ Processing Tasks due-today digests...');

	if (!isWithinDailyDigestWindow(currentHour, currentMinute)) {
		logger.debug(`   ⏭️  Before Tasks digest start time (${DAILY_AGENDA_DIGEST_TIME} PT)`);
		return;
	}

	const allUsers = db
		.select({
			id: user.id,
			email: user.email,
			name: user.name
		})
		.from(user)
		.all();

	logger.debug(`   Found ${allUsers.length} users for Tasks due-today digests`);

	let sentCount = 0;

	for (const userData of allUsers) {
		if (await alreadySentTasksDueTodayDigest(userData.id, todayPacific)) {
			logger.debug(
				`   ⏭️  Already sent Tasks due-today digest to ${userData.email} for ${todayPacific}`
			);
			continue;
		}

		const dueTodayTasks = await loadTasksDueToday(userData.id, todayPacific);
		if (dueTodayTasks.length === 0) {
			logger.debug(`   ⏭️  No Tasks due today for ${userData.email}`);
			continue;
		}

		const title = buildTasksDueTodayDigestTitle(todayPacific);
		const message = buildTasksDueTodayDigestMessage(dueTodayTasks, todayPacific);

		logger.debug(
			`   📧 Sending Tasks due-today digest to ${userData.email} (${dueTodayTasks.length} tasks)`
		);

		try {
			await sendTasksDueTodayEmail(userData.email, userData.name, dueTodayTasks, todayPacific);

			await sendReminderNotification(message, title, TASKS_DUE_TODAY_DIGEST_TAGS);

			await logNotification(userData.id, TASKS_DUE_TODAY_NOTIFICATION_TYPE, todayPacific, title);

			sentCount++;
			logger.debug('   ✅ Sent successfully');
		} catch (error) {
			logger.error('   ❌ Failed to send Tasks due-today digest', {
				error,
				userId: userData.id
			});
		}
	}

	logger.debug(`   📊 Sent ${sentCount} Tasks due-today digests`);
}

/**
 * Process visit reminders for visits scheduled today
 */
async function processVisitsTodayReminders(todayPacific: string): Promise<void> {
	logger.debug("\n🗓️ Processing today's visit reminders...");

	// Find all visits where followUpDate is today
	const todayVisits = db
		.select({
			visit: visits,
			person: people,
			user: user
		})
		.from(visits)
		.innerJoin(people, eq(visits.personId, people.id))
		.innerJoin(user, eq(visits.userId, user.id))
		.where(and(eq(visits.followUpDate, todayPacific), eq(people.isArchived, false)))
		.all();

	logger.debug(`   Found ${todayVisits.length} visits scheduled for today`);

	let sentCount = 0;

	for (const { visit, person, user: userData } of todayVisits) {
		if (person.isExempt) {
			logger.debug(`   ⏭️  Skipping exempt person ${person.name}`);
			continue;
		}

		const entityId = buildVisitTodayReminderEntityId(visit.id);

		if (await alreadySentToday(userData.id, VISIT_TODAY_REMINDER_NOTIFICATION_TYPE, entityId)) {
			logger.debug(`   ⏭️  Already sent today reminder for ${person.name} today`);
			continue;
		}

		const formattedDate = formatReminderDate(todayPacific);
		const subject = buildVisitTodayReminderSubject(person.name);

		logger.debug(
			`   📧 Sending visit-today reminder to ${userData.email} (${person.name} on ${todayPacific})`
		);

		try {
			await sendVisitTodayReminderEmail(userData.email, userData.name, person.name, formattedDate);

			await sendReminderNotification(
				`You have a visit with ${person.name} today, ${formattedDate}.`,
				'Synapse - Visit Today',
				'busts_in_silhouette',
				3
			);

			await logNotification(userData.id, VISIT_TODAY_REMINDER_NOTIFICATION_TYPE, entityId, subject);

			sentCount++;
			logger.debug(`   ✅ Sent successfully`);
		} catch (error) {
			logger.error(`   ❌ Failed to send:`, { error });
		}
	}

	logger.debug(`   📊 Sent ${sentCount} visit-today reminders`);
}

/**
 * Process scheduled visit reminders (one week before follow-up date)
 */
async function processScheduledVisitReminders(): Promise<void> {
	logger.debug('\n📅 Processing scheduled visit reminders...');

	const oneWeekFromNow = getDateDaysAhead(new Date(), 7);
	logger.debug(`   Looking for visits with followUpDate = ${oneWeekFromNow}`);

	// Find all visits where followUpDate is exactly one week from today
	const upcomingVisits = db
		.select({
			visit: visits,
			person: people,
			user: user
		})
		.from(visits)
		.innerJoin(people, eq(visits.personId, people.id))
		.innerJoin(user, eq(visits.userId, user.id))
		.where(and(eq(visits.followUpDate, oneWeekFromNow), eq(people.isArchived, false)))
		.all();

	logger.debug(`   Found ${upcomingVisits.length} upcoming visits in one week`);

	let sentCount = 0;

	for (const { visit, person, user: userData } of upcomingVisits) {
		if (person.isExempt) {
			logger.debug(`   ⏭️  Skipping exempt person ${person.name}`);
			continue;
		}

		const entityId = buildScheduledVisitReminderEntityId(visit.id);

		// Check if we already sent a reminder for this visit
		if (await alreadySentToday(userData.id, SCHEDULED_VISIT_REMINDER_NOTIFICATION_TYPE, entityId)) {
			logger.debug(`   ⏭️  Already sent reminder for ${person.name} today`);
			continue;
		}

		const formattedFollowUpDate = formatReminderDate(oneWeekFromNow);
		const subject = buildScheduledVisitReminderSubject(person.name);

		logger.debug(
			`   📧 Sending scheduled visit reminder to ${userData.email} (${person.name} on ${oneWeekFromNow})`
		);

		try {
			await sendScheduledVisitReminderEmail(
				userData.email,
				userData.name,
				person.name,
				formattedFollowUpDate
			);

			await sendReminderNotification(
				`Upcoming visit with ${person.name} is scheduled for ${formattedFollowUpDate}.`,
				'Synapse - Upcoming Visit',
				'calendar',
				3
			);

			await logNotification(
				userData.id,
				SCHEDULED_VISIT_REMINDER_NOTIFICATION_TYPE,
				entityId,
				subject
			);

			sentCount++;
			logger.debug(`   ✅ Sent successfully`);
		} catch (error) {
			logger.error(`   ❌ Failed to send:`, { error });
		}
	}

	logger.debug(`   📊 Sent ${sentCount} scheduled visit reminders`);
}

/**
 * Main execution
 */
export async function runEmailNotifications(): Promise<{ ok: true } | { ok: false; error: Error }> {
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
	const todayPacific = getTodayString(now);

	logger.debug(
		`⏰ Current time (PST/PDT): ${currentTime}, Day: ${currentDay}, Date: ${todayPacific}`
	);

	try {
		await processDailyAgendaDigests(currentHour, currentMinute, todayPacific);
		await processTasksDueTodayDigests(currentHour, currentMinute, todayPacific);
		await processWorkoutReminders(currentDay, currentHour, currentMinute);
		await processMeditationReminders(currentDay, currentHour, currentMinute);
		await processVisitWarnings();
		await processVisitsTodayReminders(todayPacific);
		await processScheduledVisitReminders();

		logger.debug('\n✅ Email notifications cron job completed successfully!');
		return { ok: true };
	} catch (error) {
		logger.error('\n❌ Email notifications cron job failed:', { error });
		return { ok: false, error: error instanceof Error ? error : new Error('Unknown error') };
	}
}
