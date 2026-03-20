import { expect, type Page, test } from '@playwright/test';

const testUserEmail = process.env.E2E_USER_EMAIL;
const testUserPassword = process.env.E2E_USER_PASSWORD;

const boardTaskTitle = 'Prepare Treasures Talk';
const primaryLane = 'In Progress tasks';
const secondaryLane = 'New tasks';
const laneLabels = [primaryLane, secondaryLane, 'On Hold tasks', 'Blocked tasks', 'Done tasks'];

test.describe('tasks kanban drag and drop', () => {
	test.skip(
		!testUserEmail || !testUserPassword,
		'Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.test to run this spec.'
	);

	test('moves a task across lanes without client-side errors and restores the board', async ({
		page
	}) => {
		test.slow();

		const pageErrors: string[] = [];
		const consoleErrors: string[] = [];

		page.on('pageerror', (error) => {
			pageErrors.push(String(error));
		});

		page.on('console', (message) => {
			if (message.type() === 'error') {
				consoleErrors.push(message.text());
			}
		});

		await signIn(page, testUserEmail ?? '', testUserPassword ?? '');
		await page.goto('/tasks');
		await expect(page.getByRole('heading', { name: 'Tasks' }).first()).toBeVisible();
		await expect(page.locator(`[aria-label="${primaryLane}"]`)).toBeVisible();

		const startingLane = await findLaneForTask(page, boardTaskTitle);
		expect(startingLane).not.toBeNull();

		const sourceLane = startingLane ?? primaryLane;
		const destinationLane = sourceLane === secondaryLane ? primaryLane : secondaryLane;

		try {
			await moveTaskAndAssert(page, boardTaskTitle, destinationLane);
			await expect(taskInLane(page, destinationLane, boardTaskTitle)).toBeVisible();
			await expect(taskInLane(page, sourceLane, boardTaskTitle)).toHaveCount(0);
		} finally {
			const currentLane = await findLaneForTask(page, boardTaskTitle);
			if (currentLane && currentLane !== sourceLane) {
				await moveTaskAndAssert(page, boardTaskTitle, sourceLane);
			}
		}

		await expect(taskInLane(page, sourceLane, boardTaskTitle)).toBeVisible();
		expect(pageErrors).toEqual([]);
		expect(consoleErrors).toEqual([]);
	});
});

async function signIn(page: Page, email: string, password: string) {
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);

	await Promise.all([
		page.waitForURL('**/dashboard'),
		page.getByRole('button', { name: 'Sign in' }).click()
	]);
}

function laneLocator(page: Page, laneLabel: string) {
	return page.locator(`[aria-label="${laneLabel}"]`).first();
}

function taskInLane(page: Page, laneLabel: string, taskTitle: string) {
	return laneLocator(page, laneLabel).locator(`[aria-label="${taskTitle}"]`).first();
}

async function findLaneForTask(page: Page, taskTitle: string) {
	for (const laneLabel of laneLabels) {
		if (await taskInLane(page, laneLabel, taskTitle).count()) {
			return laneLabel;
		}
	}

	return null;
}

async function moveTaskAndAssert(page: Page, taskTitle: string, targetLaneLabel: string) {
	const task = page.locator(`[aria-label="${taskTitle}"]`).first();
	const targetLane = laneLocator(page, targetLaneLabel);

	await task.scrollIntoViewIfNeeded();
	await targetLane.scrollIntoViewIfNeeded();

	const sourceBox = await task.boundingBox();
	const targetBox = await targetLane.boundingBox();

	if (!sourceBox || !targetBox) {
		throw new Error(`Could not resolve drag coordinates for ${taskTitle} -> ${targetLaneLabel}`);
	}

	const moveResponse = page.waitForResponse(
		(response) =>
			response.url().includes('?/moveBoardTask') &&
			response.request().method() === 'POST' &&
			response.status() === 200
	);

	const startX = sourceBox.x + sourceBox.width / 2;
	const startY = sourceBox.y + Math.min(28, sourceBox.height / 2);
	const targetX = targetBox.x + targetBox.width / 2;
	const targetY = targetBox.y + Math.min(targetBox.height * 0.55, targetBox.height - 24);

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.waitForTimeout(120);
	await page.mouse.move(startX + 18, startY + 8, { steps: 6 });
	await page.waitForTimeout(100);
	await page.mouse.move(targetX, targetY, { steps: 28 });
	await page.waitForTimeout(160);
	await page.mouse.up();

	await moveResponse;
	await expect(taskInLane(page, targetLaneLabel, taskTitle)).toBeVisible();
}
