import { Resend } from 'resend';

import { logger } from '$lib/utils/logger';

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
