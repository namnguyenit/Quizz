import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

// Helper to parse User-Agent
function getBrowserInfo(ua: string) {
	const uaLower = ua.toLowerCase();
	let browser = 'Unknown';
	let device = 'Desktop';
	let os = 'Unknown';

	if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(uaLower)) {
		device = 'Tablet';
	} else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
		device = 'Mobile';
	}

	if (uaLower.includes('win')) os = 'Windows';
	else if (uaLower.includes('mac')) os = 'macOS';
	else if (uaLower.includes('linux')) os = 'Linux';
	else if (uaLower.includes('android')) os = 'Android';
	else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS';

	if (uaLower.includes('edg')) browser = 'Edge';
	else if (uaLower.includes('opr') || uaLower.includes('opera')) browser = 'Opera';
	else if (uaLower.includes('chrome') || uaLower.includes('crios')) browser = 'Chrome';
	else if (uaLower.includes('firefox') || uaLower.includes('fxios')) browser = 'Firefox';
	else if (uaLower.includes('safari')) browser = 'Safari';

	return { browser, device, os };
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const db = createClient({
		url: env.TURSO_URL,
		authToken: env.TURSO_AUTH_TOKEN
	});

	try {
        // Because navigator.sendBeacon sends text/plain, we parse manually or use request.text()
		const text = await request.text();
        const body = JSON.parse(text);
		const { action, session_id, duration } = body;

		if (action === 'start') {
			let ip = 'Unknown';
			try { ip = getClientAddress(); } catch(e) {}
			if (request.headers.get('x-forwarded-for')) ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || ip;
			if (request.headers.get('x-real-ip')) ip = request.headers.get('x-real-ip') || ip;
			if (ip === '::1') ip = '127.0.0.1';

			let location = 'Unknown';
			if (request.headers.get('x-vercel-ip-city') && request.headers.get('x-vercel-ip-country')) {
				location = `${request.headers.get('x-vercel-ip-country')}, ${request.headers.get('x-vercel-ip-city')}`;
			} else if (ip && ip !== '127.0.0.1' && ip !== 'Unknown') {
				try {
					const locData = await fetch(`http://ip-api.com/json/${ip}`).then(res => res.json());
					if (locData.status === 'success') {
						location = `${locData.country}, ${locData.city}`;
					}
				} catch(e) {}
			}

			const ua = request.headers.get('user-agent') || '';
			const { browser, device, os } = getBrowserInfo(ua);

			// create table if not exists
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

			await db.execute({
				sql: `INSERT OR REPLACE INTO visitor_logs (session_id, ip_address, location, device, os, browser, visited_at, duration) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)`,
				args: [session_id, ip, location, device, os, browser]
			});

			return json({ success: true });
		} else if (action === 'update' && session_id) {
			await db.execute({
				sql: `UPDATE visitor_logs SET duration = ? WHERE session_id = ?`,
				args: [duration || 0, session_id]
			});
			return json({ success: true });
		}

		return json({ error: 'invalid action' }, { status: 400 });
	} catch (e) {
		console.error('Tracking Error:', e);
		return json({ error: 'internal error' }, { status: 500 });
	}
};
