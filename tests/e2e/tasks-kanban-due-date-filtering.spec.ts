import { expect, type Page, test } from '@playwright/test';

const testUserEmail = process.env.E2E_USER_EMAIL;
const testUserPassword = process.env.E2E_USER_PASSWORD;

test.describe('tasks kanban due date filtering', () => {
	test.skip(
		!testUserEmail || !testUserPassword,
		'Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.test to run this spec.'
	);

	async function signIn(page: Page, email: string, password: string): Promise<void> {
		await page.goto('/sign-in');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password').fill(password);
		await page.getByRole('button', { name: 'Sign In' }).click();
		await page.waitForURL('/dashboard');
	}

	async function navigateToKanbanBoard(page: Page): Promise<void> {
		await page.goto('/tasks');
		await expect(page.getByRole('heading', { name: 'Tasks' }).first()).toBeVisible();

		// Ensure we're on the kanban tab
		const kanbanTab = page.getByRole('tab', { name: 'Kanban' });
		await kanbanTab.click();
	}

	async function openFilters(page: Page): Promise<void> {
		const filterButton = page.getByRole('button', { name: 'Toggle task filters' });
		await filterButton.click();
		await expect(page.locator('#tasks-filter-bar')).toBeVisible();
	}

	async function openDueDateFilter(page: Page): Promise<void> {
		const dueDateFilterButton = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await dueDateFilterButton.click();
		await expect(page.getByText('Search due date filters...')).toBeVisible();
	}

	test('displays due date filter in filter bar when filters are opened', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);
		await openFilters(page);

		// Check that the due date filter is present
		const dueDateFilter = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await expect(dueDateFilter).toBeVisible();
	});

	test('shows due date filter options when opened', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);
		await openFilters(page);
		await openDueDateFilter(page);

		// Check that all due date filter options are available
		await expect(page.getByText('Overdue')).toBeVisible();
		await expect(page.getByText('Due Today')).toBeVisible();
		await expect(page.getByText('Upcoming')).toBeVisible();
	});

	test('can select and deselect due date filters', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);
		await openFilters(page);
		await openDueDateFilter(page);

		// Select "Due Today" filter
		await page.getByText('Due Today').click();

		// Close the dropdown by clicking the button again
		const dueDateFilterButton = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await dueDateFilterButton.click();

		// Check that the filter appears as a badge
		await expect(page.getByText('Due Today').first()).toBeVisible();

		// Check that the URL contains the due date filter
		await expect(page).toHaveURL(/dueDate=today/);

		// Reopen filter to deselect
		await openDueDateFilter(page);
		await page.getByText('Due Today').click();
		await dueDateFilterButton.click();

		// Check that the filter badge is removed
		await expect(page.getByText('Due Today').first()).not.toBeVisible();

		// Check that the URL parameter is removed
		await expect(page).not.toHaveURL(/dueDate=today/);
	});

	test('can select multiple due date filters', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);
		await openFilters(page);
		await openDueDateFilter(page);

		// Select multiple filters
		await page.getByText('Overdue').click();
		await page.getByText('Due Today').click();

		// Close the dropdown
		const dueDateFilterButton = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await dueDateFilterButton.click();

		// Check that multiple filter badges appear
		await expect(page.getByText('Overdue').first()).toBeVisible();
		await expect(page.getByText('Due Today').first()).toBeVisible();

		// Check that the URL contains both filters
		await expect(page).toHaveURL(/dueDate=overdue%2Ctoday|dueDate=today%2Coverdue/);

		// Check that the dropdown button shows count
		await expect(dueDateFilterButton).toContainText('2 due date filters selected');
	});

	test('can clear all due date filters at once', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);
		await openFilters(page);
		await openDueDateFilter(page);

		// Select multiple filters
		await page.getByText('Overdue').click();
		await page.getByText('Upcoming').click();

		// Clear all filters using the clear button
		await page.getByText('Clear due date filters').click();

		// Close the dropdown
		const dueDateFilterButton = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await dueDateFilterButton.click();

		// Check that no filter badges appear
		await expect(page.getByText('Overdue').first()).not.toBeVisible();
		await expect(page.getByText('Upcoming').first()).not.toBeVisible();

		// Check that the URL parameter is removed
		await expect(page).not.toHaveURL(/dueDate=/);

		// Check that the dropdown button shows default text
		await expect(dueDateFilterButton).toContainText('Due date');
	});

	test('can remove individual due date filter badges', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);
		await openFilters(page);
		await openDueDateFilter(page);

		// Select multiple filters
		await page.getByText('Overdue').click();
		await page.getByText('Due Today').click();

		// Close the dropdown
		const dueDateFilterButton = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await dueDateFilterButton.click();

		// Remove the "Overdue" filter by clicking the x button on its badge
		const overdueBadge = page.getByText('Overdue').first().locator('..');
		await overdueBadge.getByRole('button', { name: 'Remove due date filter Overdue' }).click();

		// Check that only "Due Today" filter remains
		await expect(page.getByText('Overdue').first()).not.toBeVisible();
		await expect(page.getByText('Due Today').first()).toBeVisible();

		// Check that the URL only contains the remaining filter
		await expect(page).toHaveURL(/dueDate=today/);
		await expect(page).not.toHaveURL(/overdue/);
	});

	test('due date filter integrates with other filters', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);
		await openFilters(page);

		// Set a keyword filter
		await page.getByPlaceholder('Search title or description').fill('test task');

		// Add a due date filter
		await openDueDateFilter(page);
		await page.getByText('Due Today').click();

		const dueDateFilterButton = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await dueDateFilterButton.click();

		// Check that both filters are applied
		await expect(page).toHaveURL(/keyword=test\+task/);
		await expect(page).toHaveURL(/dueDate=today/);

		// Check that filter badges show
		await expect(page.getByText('Due Today').first()).toBeVisible();
	});

	test('filter state persists on page refresh', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);
		await openFilters(page);
		await openDueDateFilter(page);

		// Select a filter
		await page.getByText('Upcoming').click();

		const dueDateFilterButton = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await dueDateFilterButton.click();

		// Refresh the page
		await page.reload();
		await expect(page.getByRole('heading', { name: 'Tasks' }).first()).toBeVisible();

		// Check that the filter is still applied
		await expect(page).toHaveURL(/dueDate=upcoming/);

		// Open filters to check the UI state
		await openFilters(page);
		await expect(page.getByText('Upcoming').first()).toBeVisible();
	});

	test('filter button highlights when due date filters are active', async ({ page }) => {
		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await navigateToKanbanBoard(page);

		// Check initial state - filter button should not be highlighted
		const filterButton = page.getByRole('button', { name: 'Toggle task filters' });

		await openFilters(page);
		await openDueDateFilter(page);

		// Select a filter
		await page.getByText('Due Today').click();

		const dueDateFilterButton = page.getByRole('combobox').filter({ hasText: 'Due date' });
		await dueDateFilterButton.click();

		// Close filters
		await filterButton.click();

		// Check that the filter button is highlighted (has active styling)
		await expect(filterButton).toHaveClass(/border-orange-300/);
	});
});
