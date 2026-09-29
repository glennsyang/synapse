import type { SidebarNav } from '$lib/types';
import { Book, Dumbbell, Heart, House, Shield, SquareCheck, Users } from '@lucide/svelte/icons';

export const navItems: SidebarNav = {
	navMain: [
		{
			title: 'Dashboard',
			description: 'Overview of your activities and stats',
			url: '/dashboard',
			icon: House,
			pen: 'teal',
			short: 'Today'
		},
		{
			title: 'Journal',
			description: 'Capture your daily thoughts and experiences',
			url: '/journal',
			icon: Book,
			pen: 'blue',
			short: 'Journal'
		},
		{
			title: 'Tasks',
			description: 'Track work on a kanban board with priorities and states',
			url: '/tasks',
			icon: SquareCheck,
			pen: 'orange',
			short: 'Tasks'
		},
		{
			title: 'Fitness',
			description: 'Track workouts, meals, and weight progress',
			url: '/fitness',
			icon: Dumbbell,
			pen: 'green',
			short: 'Fitness'
		},
		{
			title: 'Meditation',
			description: 'Build mindfulness habits with guided routines',
			url: '/meditation',
			icon: Heart,
			pen: 'purple',
			short: 'Meditation'
		},
		{
			title: 'Visits',
			description: 'Keep track of meaningful connections',
			url: '/visits',
			icon: Users,
			pen: 'pink',
			short: 'Visits'
		},
		{
			title: 'Admin',
			description: 'Manage users and archived contacts',
			url: '/admin',
			icon: Shield,
			pen: 'teal',
			short: 'Admin',
			adminOnly: true
		}
	]
};
