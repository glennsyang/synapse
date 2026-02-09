/**
 * Standard CRUD message templates for consistent user feedback across the application.
 * These messages are used in superforms message() calls for success/error states.
 */

export interface CrudMessages {
	createSuccess?: string;
	createError?: string;
	updateSuccess?: string;
	updateError?: string;
	deleteSuccess?: string;
	deleteError?: string;
}

/**
 * Default CRUD message templates.
 * Can be overridden on a per-entity basis via CrudConfig.
 */
export const DEFAULT_CRUD_MESSAGES = {
	createSuccess: (entityName: string) => `${entityName} created successfully`,
	createError: (entityName: string) =>
		`Failed to create ${entityName.toLowerCase()}. A database error occurred.`,
	updateSuccess: (entityName: string) => `${entityName} updated successfully`,
	updateError: (entityName: string) =>
		`Failed to update ${entityName.toLowerCase()}. A database error occurred.`,
	deleteSuccess: (entityName: string) => `${entityName} deleted successfully`,
	deleteError: (entityName: string) =>
		`Failed to delete ${entityName.toLowerCase()}. A database error occurred.`
};

/**
 * Get the message text for a CRUD operation.
 *
 * @param operation - The CRUD operation type
 * @param entityName - The entity name (e.g., "Transaction", "Category")
 * @param customMessages - Optional custom messages to override defaults
 * @returns The message text
 */
export function getCrudMessage(
	operation:
		| 'createSuccess'
		| 'createError'
		| 'updateSuccess'
		| 'updateError'
		| 'deleteSuccess'
		| 'deleteError',
	entityName: string,
	customMessages?: CrudMessages
): string {
	if (customMessages?.[operation]) {
		return customMessages[operation];
	}
	return DEFAULT_CRUD_MESSAGES[operation](entityName);
}
