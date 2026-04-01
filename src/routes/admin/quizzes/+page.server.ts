import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ cookies }) => {
	const auth = cookies.get('adminAuth');
	if (auth !== 't') {
		throw redirect(303, '/admin');
	}

	const db = createClient({
		url: env.TURSO_URL,
		authToken: env.TURSO_AUTH_TOKEN
	});

	try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS quiz_views (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visitor_id TEXT,
                quiz_path TEXT,
                viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
	} catch(e) {}

	const { rows } = await db.execute(`
		SELECT quiz_path, COUNT(*) as total_views, COUNT(DISTINCT visitor_id) as unique_users
		FROM quiz_views 
		GROUP BY quiz_path
		ORDER BY total_views DESC
	`);

	return { 
		authorized: true,
		stats: rows.map(r => ({
			quiz_path: typeof r.quiz_path === 'string' ? r.quiz_path : '',
			total_views: typeof r.total_views === 'number' ? r.total_views : 0,
			unique_users: typeof r.unique_users === 'number' ? r.unique_users : 0
		}))
	};
};
