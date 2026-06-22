import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'Missing collection id' }, { status: 400 });

	const db = createClient({
		url: env.TURSO_URL,
		authToken: env.TURSO_AUTH_TOKEN
	});

	try {
		const rows = await db.execute({
			sql: `
				SELECT *
				FROM flashcards
				WHERE collection_id = ?
				ORDER BY
					COALESCE(card_order, 0) ASC,
					id ASC
			`,
			args: [id]
		});

		return json({ flashcards: rows.rows });
	} catch (err) {
		return json(
			{ error: 'Failed to fetch flashcards', details: err instanceof Error ? err.message : err },
			{ status: 500 }
		);
	}
};
