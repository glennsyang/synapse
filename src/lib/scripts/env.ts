import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.string().min(1),
	RESEND_API_KEY: z.string().min(1),
	RESEND_FROM_ADDRESS: z.email()
});

export function getScriptEnv() {
	const parsed = envSchema.safeParse(process.env);

	if (!parsed.success) {
		console.error('❌ Invalid environment variables for email script:');
		console.error(parsed.error.flatten().fieldErrors);
		throw new Error('Missing required environment variables');
	}

	return parsed.data;
}
