import { z } from 'zod';

export const apiPeopleListQuerySchema = z.object({
	includeArchived: z
		.enum(['true', 'false'])
		.optional()
		.transform((value) => value === 'true')
});
