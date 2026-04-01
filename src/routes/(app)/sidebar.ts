import { Book, Dumbbell, Heart, House, SquareCheck, Users } from '@lucide/svelte/icons';
import type { SidebarNav } from '$lib/types';

export const navItems: SidebarNav = {
	navMain: [
		{
			title: 'Dashboard',
			description: 'Overview of your activities and stats',
			url: '/dashboard',
			icon: House,
			color: 'text-teal-600 dark:text-teal-400'
		},
		{
			title: 'Journal',
			description: 'Capture your daily thoughts and experiences',
			url: '/journal',
			icon: Book,
			color: 'text-blue-600 dark:text-blue-400'
		},
		{
			title: 'Tasks',
			description: 'Track work on a kanban board with priorities and states',
			url: '/tasks',
			icon: SquareCheck,
			color: 'text-orange-600 dark:text-orange-400'
		},
		{
			title: 'Fitness',
			description: 'Track workouts, meals, and weight progress',
			url: '/fitness',
			icon: Dumbbell,
			color: 'text-green-600 dark:text-green-400'
		},
		{
			title: 'Meditation',
			description: 'Build mindfulness habits with guided routines',
			url: '/meditation',
			icon: Heart,
			color: 'text-purple-600 dark:text-purple-400'
		},
		{
			title: 'Visits',
			description: 'Keep track of meaningful connections',
			url: '/visits',
			icon: Users,
			color: 'text-pink-600 dark:text-pink-400'
		}
	]
};
