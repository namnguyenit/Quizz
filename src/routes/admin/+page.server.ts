import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ cookies }) => {
	const auth = cookies.get('adminAuth');
	if (auth !== 't') {
		return { authorized: false, logs: [] };
	}

	const db = createClient({
		url: env.TURSO_URL,
		authToken: env.TURSO_AUTH_TOKEN
	});

	// Ensure the new log table exists just in case
	await db.execute(`
		CREATE TABLE IF NOT EXISTS visitor_logs (
			session_id TEXT PRIMARY KEY,
			ip_address TEXT,
			location TEXT,
			device TEXT,
			os TEXT,
			browser TEXT,
			visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			duration INTEGER DEFAULT 0
		)
	`);

	// Fetch logs
	const { rows } = await db.execute(`
		SELECT * FROM visitor_logs ORDER BY visited_at DESC LIMIT 5000
	`);
	
	const logs = rows.map(r => ({
		session_id: typeof r.session_id === 'string' ? r.session_id : '',
		ip_address: typeof r.ip_address === 'string' ? r.ip_address : '',
		location: typeof r.location === 'string' ? r.location : '',
		device: typeof r.device === 'string' ? r.device : '',
		os: typeof r.os === 'string' ? r.os : '',
		browser: typeof r.browser === 'string' ? r.browser : '',
		visited_at: typeof r.visited_at === 'string' ? r.visited_at : '',
		duration: typeof r.duration === 'number' ? r.duration : 0
	}));

	return { 
		authorized: true, 
		logs
	};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password');

		if (password === 'moimoimoi1234') {
			cookies.set('adminAuth', 't', { path: '/admin', maxAge: 60 * 60 * 24 * 7 });
			return { success: true };
		} else {
			return fail(400, { error: '⚠️ Mật khẩu không chính xác minh!' });
		}
	},
	logout: async ({ cookies }) => {
		cookies.delete('adminAuth', { path: '/admin' });
		throw redirect(303, '/admin');
	}
};
