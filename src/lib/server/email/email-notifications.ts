/**
 * Email Notifications Cron Job
 *
 * Runs twice daily (midnight and noon) to send scheduled reminders:
 * - Workout reminders (based on workout_reminders table)
 * - Meditation reminders (based on meditation_schedules table)
 * - Visit warnings (for people not seen in 6+ months)
 *
 * Logs all sent emails in email_notifications table to prevent duplicates.
 */

import { and, eq, sql } from 'drizzle-orm';

import getDb from '../db';

// Import schemas
import {
	emailNotifications,
	meditationRoutines,
	meditationSchedules,
	people,
	user,
	visits,
	workoutReminders
} from './../db/schema';
// Email functions
import {
	sendMeditationReminderEmail,
	sendVisitWarningEmail,
	sendWorkoutReminderEmail
} from './index';

// Get database instance
const db = getDb();

console.log('🚀 Starting email notifications cron job...');
console.log(`📅 Current time: ${new Date().toISOString()}`);

// Get current time info
const now = new Date();
const currentHour = now.getHours().toString().padStart(2, '0');
const currentMinute = now.getMinutes().toString().padStart(2, '0');
const currentTime = `${currentHour}:${currentMinute}`;
const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

console.log(`⏰ Current time: ${currentTime}, Day: ${currentDay}`);

/**
 * Check if this reminder should fire today based on cadence and days_of_week
 */
function shouldFireToday(cadence: string, daysOfWeek: string | null): boolean {
	if (cadence === 'daily') {
		return true;
	}
	if (cadence === 'weekly' && daysOfWeek) {
		try {
			const days: number[] = JSON.parse(daysOfWeek);
			return days.includes(currentDay);
		} catch (e) {
			console.error('❌ Error parsing days_of_week:', e);
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
async function processWorkoutReminders(): Promise<void> {
	console.log('\n💪 Processing workout reminders...');

	const reminders = await db
		.select({
			reminder: workoutReminders,
			user: user
		})
		.from(workoutReminders)
		.innerJoin(user, eq(workoutReminders.userId, user.id))
		.where(eq(workoutReminders.enabled, true))
		.all();

	console.log(`   Found ${reminders.length} enabled workout reminders`);

	let sentCount = 0;

	for (const { reminder, user: userData } of reminders) {
		// Check if should fire today
		if (!shouldFireToday(reminder.cadence, reminder.daysOfWeek)) {
			continue;
		}

		// Check if time matches (within 30 minute window to account for cron timing)
		const [reminderHour] = reminder.time.split(':');
		const hourDiff = Math.abs(Number.parseInt(currentHour) - Number.parseInt(reminderHour));

		// Only send if we're within the same hour window
		if (hourDiff !== 0) {
			continue;
		}

		// Check if already sent today
		if (await alreadySentToday(userData.id, 'workout_reminder', reminder.id)) {
			console.log(`   ⏭️  Already sent to ${userData.email} today`);
			continue;
		}

		// Send email
		console.log(
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
			console.log(`   ✅ Sent successfully`);
		} catch (error) {
			console.error(`   ❌ Failed to send:`, error);
		}
	}

	console.log(`   📊 Sent ${sentCount} workout reminders`);
}

/**
 * Process meditation reminders
 */
async function processMeditationReminders(): Promise<void> {
	console.log('\n🧘 Processing meditation reminders...');

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

	console.log(`   Found ${schedules.length} enabled meditation schedules`);

	let sentCount = 0;

	for (const { schedule, routine, user: userData } of schedules) {
		// Check if should fire today
		if (!shouldFireToday(schedule.cadence, schedule.daysOfWeek)) {
			continue;
		}

		// Check if time matches (within 30 minute window)
		const [scheduleHour] = schedule.time.split(':');
		const hourDiff = Math.abs(Number.parseInt(currentHour) - Number.parseInt(scheduleHour));

		// Only send if we're within the same hour window
		if (hourDiff !== 0) {
			continue;
		}

		// Check if already sent today
		if (await alreadySentToday(userData.id, 'meditation_reminder', schedule.id)) {
			console.log(`   ⏭️  Already sent to ${userData.email} today`);
			continue;
		}

		// Send email
		console.log(
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
			console.log(`   ✅ Sent successfully`);
		} catch (error) {
			console.error(`   ❌ Failed to send:`, error);
		}
	}

	console.log(`   📊 Sent ${sentCount} meditation reminders`);
}

/**
 * Process visit warnings (people not seen in 6+ months)
 */
async function processVisitWarnings(): Promise<void> {
	console.log('\n👥 Processing visit warnings...');

	// Get all people with their last visit date
	const allPeople = await db
		.select({
			person: people,
			user: user
		})
		.from(people)
		.innerJoin(user, eq(people.userId, user.id))
		.all();

	console.log(`   Found ${allPeople.length} people to check`);

	let sentCount = 0;
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	for (const { person, user: userData } of allPeople) {
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

		const lastVisitDate = new Date(lastVisit.date);
		const monthsSinceVisit = Math.floor(
			(now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
		);

		// Only send warnings for 6+ months
		if (monthsSinceVisit < 6) {
			continue;
		}

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
					eq(emailNotifications.entityId, person.id),
					sql`${emailNotifications.sentAt} >= ${sevenDaysAgo.toISOString()}`
				)
			)
			.get();

		if (recentWarning) {
			console.log(`   ⏭️  Already sent warning for ${person.name} in last 7 days`);
			continue;
		}

		// Send warning email
		console.log(
			`   📧 Sending visit warning to ${userData.email} (${person.name}, ${monthsSinceVisit} months)`
		);

		try {
			await sendVisitWarningEmail(
				userData.email,
				userData.name,
				person.name,
				lastVisit.date,
				monthsSinceVisit
			);

			await logNotification(
				userData.id,
				'visit_warning',
				person.id,
				`It's been a while since you saw ${person.name}`
			);

			sentCount++;
			console.log(`   ✅ Sent successfully`);
		} catch (error) {
			console.error(`   ❌ Failed to send:`, error);
		}
	}

	console.log(`   📊 Sent ${sentCount} visit warnings`);
}

/**
 * Main execution
 */
export async function runEmailNotifications() {
	try {
		await processWorkoutReminders();
		await processMeditationReminders();
		await processVisitWarnings();

		console.log('\n✅ Email notifications cron job completed successfully!');
		process.exit(0);
	} catch (error) {
		console.error('\n❌ Email notifications cron job failed:', error);
		process.exit(1);
	}
}
