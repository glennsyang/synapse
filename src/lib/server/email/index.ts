import {
	buildTasksDueTodayDigestTitle,
	buildTasksDueTodayEmailHtml,
	type TasksDueTodayTaskSummary
} from '$lib/server/email/tasks-due-today-digest';
import { logger } from '$lib/utils/logger';
import { getWorkoutEmoji, getWorkoutNotificationTag } from '$lib/utils/workout';
import { Resend } from 'resend';

import { getEnv } from '../../../env';

const env = getEnv();

// Initialize Resend email client
const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, name: string, verificationUrl: string) {
	logger.debug('📧 Sending Verification Email to:', { to });

	try {
		await resend.emails.send({
			from: env.RESEND_FROM_ADDRESS,
			to,
			subject: '[Synapse] Verify your email address',
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Verify your email</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Synapse</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
						<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							Thanks for signing up! Please verify your email address to get started with your second brain.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${verificationUrl}" 
							   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
								Verify Email Address
							</a>
						</div>
						<p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
							If you didn't create an account, you can safely ignore this email.
						</p>
						<p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
							This link will expire in 24 hours.
						</p>
					</div>
					<div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
						<p>Synapse - Your Personal Second Brain</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (error) {
		logger.error('❌ Failed to send verification email:', error);
		return error;
	}
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
	logger.debug('📧 Sending Password Reset Email to:', { to });

	try {
		await resend.emails.send({
			from: env.RESEND_FROM_ADDRESS,
			to,
			subject: '[Synapse] Reset your password',
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Reset your password</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
						<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							We received a request to reset your password. Click the button below to create a new password.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${resetUrl}" 
							   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
								Reset Password
							</a>
						</div>
						<p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
							If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
						</p>
						<p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
							This link will expire in 1 hour for security reasons.
						</p>
					</div>
					<div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
						<p>Synapse - Your Personal Second Brain</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (error) {
		logger.error('❌ Failed to send password reset email:', error);
		return error;
	}
}

export async function sendNewUserEmail(to: string, name: string, email: string) {
	logger.debug('📧 Sending new user email to:', { to });

	try {
		await resend.emails.send({
			from: env.RESEND_FROM_ADDRESS,
			to,
			subject: '[Synapse] New User was registered!',
			html: `Hi ${name || email}!<br><br>Welcome to Synapse! We're excited to have you on board.<br><br>Thank you,<br>Synapse Team`
		});
	} catch (error) {
		logger.error('❌ Failed to send email', error);
		return error;
	}
}

export async function sendWorkoutReminderEmail(
	to: string,
	name: string,
	workoutType: string,
	time: string
) {
	logger.debug('📧 Sending Workout Reminder Email to:', { to });

	const emoji = getWorkoutEmoji(workoutType);

	try {
		await resend.emails.send({
			from: process.env.RESEND_FROM_ADDRESS || '',
			to,
			subject: `[Synapse] ${emoji} Time for your ${workoutType} workout!`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Workout Reminder</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px;">${emoji} Workout Reminder</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
						<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							This is your friendly reminder that you scheduled a <strong>${workoutType}</strong> workout for <strong>${time}</strong> today.
						</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							Remember: consistency is key! Even a short workout is better than none.
						</p>
						<div style="background: #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								💡 <em>"The only bad workout is the one that didn't happen."</em>
							</p>
						</div>
						<p style="font-size: 16px; margin-top: 20px;">
							Ready to crush it? Let's go! 💪
						</p>
					</div>
					<div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
						<p>Synapse - Your Personal Second Brain</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (error) {
		logger.error('❌ Failed to send workout reminder email:', { error });
		return error;
	}
}

export async function sendMeditationReminderEmail(
	to: string,
	name: string,
	routineTitle: string,
	time: string
) {
	logger.debug('📧 Sending Meditation Reminder Email to:', { to });

	try {
		await resend.emails.send({
			from: process.env.RESEND_FROM_ADDRESS || '',
			to,
			subject: '[Synapse] 🧘 Time for your meditation practice',
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Meditation Reminder</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: #333; margin: 0; font-size: 28px;">🧘 Meditation Reminder</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
						<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							It's time to take a mindful moment for yourself. You scheduled <strong>${routineTitle}</strong> for <strong>${time}</strong> today.
						</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							Take a few minutes to breathe, relax, and center yourself.
						</p>
						<div style="background: #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								🌸 <em>"Peace comes from within. Do not seek it without."</em> - Buddha
							</p>
						</div>
						<p style="font-size: 16px; margin-top: 20px;">
							Find your calm. You deserve this time. 🌟
						</p>
					</div>
					<div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
						<p>Synapse - Your Personal Second Brain</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (error) {
		logger.error('❌ Failed to send meditation reminder email:', { error });
		return error;
	}
}

export async function sendVisitWarningEmail(
	to: string,
	name: string,
	personName: string,
	lastVisitDate: string,
	warningStatus: 'yellow' | 'critical'
) {
	logger.debug('📧 Sending Visit Warning Email to:', { to });

	const statusColor = warningStatus === 'critical' ? '#ef4444' : '#f59e0b';
	const statusText = warningStatus === 'critical' ? 'Critical Warning' : 'Yellow Warning';
	const reminderText =
		warningStatus === 'critical'
			? "It's been over a year! Consider scheduling a visit soon."
			: 'Consider scheduling a visit to encourage and commend.';

	try {
		await resend.emails.send({
			from: process.env.RESEND_FROM_ADDRESS || '',
			to,
			subject: `[Synapse] 👥 It's been a while since you saw ${personName}`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Visit Reminder</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px;">👥 Visit Reminder</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
						<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							It's been a while since you last saw <strong>${personName}</strong> (last visit: ${lastVisitDate}).
						</p>
						<div style="background: ${statusColor}; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
							<p style="margin: 0; font-size: 16px; font-weight: 600;">
								Status: ${statusText}
							</p>
						</div>
						<p style="font-size: 16px; margin-bottom: 20px;">
							${reminderText}
						</p>
						<div style="background: #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								💡 <em>"You should know well the appearance of your flock. Take good care of your sheep."</em>
							</p>
						</div>
						<p style="font-size: 16px; margin-top: 20px;">
							Relationships need nurturing. Maybe it's time for a visit! 💙
						</p>
					</div>
					<div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
						<p>Synapse - Your Personal Second Brain</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (error) {
		logger.error('❌ Failed to send visit warning email:', { error });
		return error;
	}
}

export async function sendTasksDueTodayEmail(
	to: string,
	name: string,
	tasks: TasksDueTodayTaskSummary[],
	dateString: string
) {
	logger.debug('📧 Sending Tasks Due Today Email to:', { to, taskCount: tasks.length });
	const title = buildTasksDueTodayDigestTitle(dateString);

	try {
		await resend.emails.send({
			from: env.RESEND_FROM_ADDRESS,
			to,
			subject: title,
			html: buildTasksDueTodayEmailHtml(name, tasks, dateString)
		});
	} catch (error) {
		logger.error('❌ Failed to send Tasks Due Today email:', { error });
		return error;
	}
}

export async function sendScheduledVisitReminderEmail(
	to: string,
	name: string,
	personName: string,
	followUpDate: string
) {
	logger.debug('📧 Sending Scheduled Visit Reminder Email to:', { to });

	try {
		await resend.emails.send({
			from: env.RESEND_FROM_ADDRESS,
			to,
			subject: `[Synapse] 📅 Upcoming visit with ${personName} in one week`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Upcoming Visit Reminder</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px;">📅 Upcoming Visit</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
						<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							Just a reminder that you have a scheduled visit with <strong>${personName}</strong> coming up on <strong>${followUpDate}</strong> — that's one week from today!
						</p>
						<div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
							<p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e40af;">
								📅 Visit scheduled for ${followUpDate}
							</p>
						</div>
						<p style="font-size: 16px; margin-bottom: 20px;">
							Now is a great time to plan and prepare for a meaningful visit.
						</p>
						<div style="background: #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								💡 <em>"You should know well the appearance of your flock. Take good care of your sheep."</em>
							</p>
						</div>
						<p style="font-size: 16px; margin-top: 20px;">
							Looking forward to a great visit! 💙
						</p>
					</div>
					<div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
						<p>Synapse - Your Personal Second Brain</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (error) {
		logger.error('❌ Failed to send scheduled visit reminder email:', { error });
		return error;
	}
}

export function getNotificationTag(workoutType: string): string {
	return getWorkoutNotificationTag(workoutType);
}
