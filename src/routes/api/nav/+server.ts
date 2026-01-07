import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	const db = createClient({
		url: env.TURSO_URL,
		authToken: env.TURSO_AUTH_TOKEN
	});

	try {
		const subjectsRow = await db.execute('SELECT * FROM subjects ORDER BY display_order ASC');
		const subjects = subjectsRow.rows;

		const collectionsRow = await db.execute(
			'SELECT * FROM quiz_collections ORDER BY display_order ASC'
		);
		const collections = collectionsRow.rows;

		const tree = subjects.map((s) => ({
			...s,
			quizzes: collections.filter((c) => c.subject_id === s.id)
		}));

		return json({ subjects: tree });
	} catch (err) {
		return json(
			{ error: 'Failed to fetch navigation', details: err instanceof Error ? err.message : err },
			{ status: 500 }
		);
	}
};
