import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('data/synapse.db');

// Predefined meditation routines
const predefinedRoutines = [
	{
		id: randomUUID(),
		userId: null, // Predefined routines have no user
		title: '10-Minute Mindfulness Meditation',
		description: 'A gentle introduction to mindfulness practice, perfect for beginners',
		linkUrl: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
		durationMinutes: 10,
		moodTags: JSON.stringify(['General', 'Anxious']),
		isPredefined: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: randomUUID(),
		userId: null,
		title: 'Anxiety Relief Meditation',
		description: 'Calm your mind and reduce anxiety with guided breathing',
		linkUrl: 'https://www.youtube.com/watch?v=O-6f5wQXSu8',
		durationMinutes: 15,
		moodTags: JSON.stringify(['Anxious', 'General']),
		isPredefined: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: randomUUID(),
		userId: null,
		title: 'Morning Energy Boost',
		description: 'Start your day with renewed energy and focus',
		linkUrl: 'https://www.youtube.com/watch?v=IFMQI8fXz3Q',
		durationMinutes: 12,
		moodTags: JSON.stringify(['Low Energy', 'Focused']),
		isPredefined: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: randomUUID(),
		userId: null,
		title: 'Focus & Concentration',
		description: 'Enhance mental clarity and improve concentration',
		linkUrl: 'https://www.youtube.com/watch?v=8TuRYV71Rgo',
		durationMinutes: 20,
		moodTags: JSON.stringify(['Focused']),
		isPredefined: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: randomUUID(),
		userId: null,
		title: 'Deep Sleep Meditation',
		description: 'Relax and prepare for restful sleep',
		linkUrl: 'https://www.youtube.com/watch?v=aEqlQvczMJQ',
		durationMinutes: 25,
		moodTags: JSON.stringify(['Pre-Sleep']),
		isPredefined: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: randomUUID(),
		userId: null,
		title: 'Body Scan Relaxation',
		description: 'Progressive relaxation to release tension',
		linkUrl: 'https://www.youtube.com/watch?v=15q-N-_ykgE',
		durationMinutes: 18,
		moodTags: JSON.stringify(['Anxious', 'Pre-Sleep', 'General']),
		isPredefined: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: randomUUID(),
		userId: null,
		title: '5-Minute Quick Reset',
		description: 'A brief meditation for busy moments',
		linkUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM',
		durationMinutes: 5,
		moodTags: JSON.stringify(['General', 'Focused', 'Low Energy']),
		isPredefined: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: randomUUID(),
		userId: null,
		title: 'Loving-Kindness Meditation',
		description: 'Cultivate compassion and positive emotions',
		linkUrl: 'https://www.youtube.com/watch?v=sz7cpV7ERsM',
		durationMinutes: 15,
		moodTags: JSON.stringify(['General', 'Low Energy']),
		isPredefined: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

try {
	const insert = db.prepare(`
		INSERT INTO meditation_routines (
			id, user_id, title, description, link_url, duration_minutes,
			mood_tags, is_predefined, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	const insertMany = db.transaction((routines) => {
		for (const routine of routines) {
			insert.run(
				routine.id,
				routine.userId,
				routine.title,
				routine.description,
				routine.linkUrl,
				routine.durationMinutes,
				routine.moodTags,
				routine.isPredefined,
				routine.createdAt,
				routine.updatedAt
			);
		}
	});

	insertMany(predefinedRoutines);

	console.log(`✅ Successfully seeded ${predefinedRoutines.length} predefined meditation routines`);
} catch (error) {
	console.error('❌ Error seeding meditation routines:', error);
	process.exit(1);
} finally {
	db.close();
}
