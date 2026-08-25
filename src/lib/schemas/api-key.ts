import { API_SCOPES } from '$lib/api-scopes';
import { z } from 'zod';

/**
 * Schema for creating a new external API key from Admin → API Keys.
 */
export const createApiKeySchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
	scopes: z.array(z.enum(API_SCOPES)).min(1, 'Select at least one scope'),
	expiresInDays: z.coerce.number().int().min(1).max(365).optional()
});

/**
 * Schema for revoking an API key. Better-auth key ids aren't UUIDs like this app's own
 * table ids, so this is a plain non-empty string rather than `z.uuid()`.
 */
export const revokeApiKeySchema = z.object({
	id: z.string().min(1, 'ID is required')
});
