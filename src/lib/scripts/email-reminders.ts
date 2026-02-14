import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWorkoutReminderEmail(
	to: string,
	name: string,
	workoutType: string,
	time: string
) {
	console.log('📧 Sending Workout Reminder Email to:', { to });

	const workoutEmojis: Record<string, string> = {
		strength: '💪',
		cardio: '🏃',
		yoga: '🧘',
		other: '🏋️'
	};

	const emoji = workoutEmojis[workoutType.toLowerCase()] || '🏋️';

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
		console.error('❌ Failed to send workout reminder email:', error);
		return error;
	}
}

export async function sendMeditationReminderEmail(
	to: string,
	name: string,
	routineTitle: string,
	time: string
) {
	console.log('📧 Sending Meditation Reminder Email to:', { to });

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
		console.error('❌ Failed to send meditation reminder email:', error);
		return error;
	}
}

export async function sendVisitWarningEmail(
	to: string,
	name: string,
	personName: string,
	lastVisitDate: string,
	monthsSinceVisit: number
) {
	console.log('📧 Sending Visit Warning Email to:', { to });

	let statusColor = '#10b981';
	let statusText = 'Green Status';

	if (monthsSinceVisit >= 12) {
		statusColor = '#ef4444';
		statusText = 'Red Alert';
	} else if (monthsSinceVisit >= 6) {
		statusColor = '#f59e0b';
		statusText = 'Yellow Warning';
	}

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
							It's been <strong>${monthsSinceVisit} months</strong> since you last saw <strong>${personName}</strong> (last visit: ${lastVisitDate}).
						</p>
						<div style="background: ${statusColor}; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
							<p style="margin: 0; font-size: 16px; font-weight: 600;">
								Status: ${statusText}
							</p>
						</div>
						<p style="font-size: 16px; margin-bottom: 20px;">
							${monthsSinceVisit >= 12 ? "It's been over a year! Consider reaching out soon." : 'Consider scheduling a visit to stay connected.'}
						</p>
						<div style="background: #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<p style="margin: 0; font-size: 14px; color: #6b7280;">
								💡 <em>"The greatest gift you can give someone is your time."</em>
							</p>
						</div>
						<p style="font-size: 16px; margin-top: 20px;">
							Relationships need nurturing. Maybe it's time to reconnect! 💙
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
		console.error('❌ Failed to send visit warning email:', error);
		return error;
	}
}
