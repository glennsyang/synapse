import BookIcon from '@lucide/svelte/icons/book';
import CheckSquareIcon from '@lucide/svelte/icons/check-square';
import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
import HeartIcon from '@lucide/svelte/icons/heart';
import HouseIcon from '@lucide/svelte/icons/house';
import UsersIcon from '@lucide/svelte/icons/users';

import type { SidebarNav } from '$lib/types';

export const navItems: SidebarNav = {
	navMain: [
		{
			title: 'Dashboard',
			description: 'Overview of your activities and stats',
			url: '/dashboard',
			icon: HouseIcon,
			color: 'text-teal-600 dark:text-teal-400'
		},
		{
			title: 'Journal',
			description: 'Capture your daily thoughts and experiences',
			url: '/journal',
			icon: BookIcon,
			color: 'text-blue-600 dark:text-blue-400'
		},
		{
			title: 'Todos',
			description: 'Organize tasks by daily, weekly, and monthly cadence',
			url: '/todos',
			icon: CheckSquareIcon,
			color: 'text-orange-600 dark:text-orange-400'
		},
		{
			title: 'Fitness',
			description: 'Track workouts, meals, and weight progress',
			url: '/fitness',
			icon: DumbbellIcon,
			color: 'text-green-600 dark:text-green-400'
		},
		{
			title: 'Meditation',
			description: 'Build mindfulness habits with guided routines',
			url: '/meditation',
			icon: HeartIcon,
			color: 'text-purple-600 dark:text-purple-400'
		},
		{
			title: 'Visits',
			description: 'Keep track of meaningful connections',
			url: '/visits',
			icon: UsersIcon,
			color: 'text-pink-600 dark:text-pink-400'
		}
	]
};
