import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'Missing quiz id' }, { status: 400 });

	const db = createClient({
		url: env.TURSO_URL,
		authToken: env.TURSO_AUTH_TOKEN
	});

	try {
		const rows = await db.execute({
			sql: 'SELECT * FROM questions WHERE collection_id = ?',
			args: [id]
		});

		const quizzes = rows.rows.map((row) => ({
			...row,
			answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers
		}));

		return json({ quizzes });
	} catch (err) {
		return json(
			{ error: 'Failed to fetch quiz', details: err instanceof Error ? err.message : err },
			{ status: 500 }
		);
	}
};
