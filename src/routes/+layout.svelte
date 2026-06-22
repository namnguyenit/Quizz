<script lang="ts">
	import { dev } from '$app/environment';
	import '@fontsource/noto-sans-sc';
	import '@fontsource-variable/noto-sans';
	import '@fontsource-variable/plus-jakarta-sans';
	import '@fontsource-variable/outfit';
	import '@fontsource-variable/manrope';
	import '@fontsource-variable/inter';
	import '@fontsource/roboto/400.css';
	import '@fontsource/roboto/500.css';
	import '@fontsource/roboto/700.css';
	import '@fontsource-variable/open-sans';
	import '@fontsource/lato/400.css';
	import '@fontsource/lato/700.css';
	import '@fontsource-variable/nunito';
	import '@fontsource/poppins/400.css';
	import '@fontsource/poppins/500.css';
	import '@fontsource/poppins/600.css';
	import '@fontsource/poppins/700.css';
	import '@fontsource-variable/source-sans-3';
	import '@fontsource-variable/dm-sans';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import '../app.css';
	import { APP_VERSION } from '../lib/config';
	import NewVersionModal from './NewVersionModal.svelte';
	import { styleState, setStyle, setFont, pageState } from './global.svelte';
	import { FONTS } from '../lib/theme';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();

	let showVersionModal = $state(false);

	// Only run on client
	import { APP_VERSION_KEY } from '../lib/localKeys';

	if (typeof window !== 'undefined') {
		const storedVersion = localStorage.getItem(APP_VERSION_KEY);
		if (!storedVersion || storedVersion !== APP_VERSION) {
			showVersionModal = true;
		}
	}

	// Apply initial style and font on mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			document.documentElement.setAttribute('data-style', styleState.style);
			const fontDef = FONTS.find((f) => f.id === styleState.font);
			if (fontDef) {
				document.documentElement.style.setProperty('--font-family', fontDef.family);
			}
		}
	});

	function confirmVersionUpdate() {
		localStorage.clear();
		localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
		showVersionModal = false;
		location.reload();
	}

	// Session Analytics Tracking
	$effect(() => {
		if (typeof window === 'undefined') return;
		if (localStorage.getItem('quiz_is_admin') === 'true') return;
		
		// 1. Tạo hoặc lấy visitor_id định danh duy nhất cho từng trình duyệt
		const VISITOR_KEY = 'quiz_uniq_visitor_id';
		let visitor_id = localStorage.getItem(VISITOR_KEY);
		if (!visitor_id) {
			visitor_id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
			localStorage.setItem(VISITOR_KEY, visitor_id);
		}

		// 2. Quản lý Session kéo dài 15 phút (cho phép người dùng tắt trình duyệt bật lại trong 15p)
		const SESSION_KEY = 'quiz_current_session_id';
		const LAST_ACTIVE_KEY = 'quiz_session_last_active';
		const DURATION_KEY = 'quiz_session_duration';
		const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 phút

		const now = Date.now();
		let session_id = localStorage.getItem(SESSION_KEY);
		let last_active = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0', 10);
		let accDuration = parseInt(localStorage.getItem(DURATION_KEY) || '0', 10);

		// Nếu không có session, hoặc đã nghỉ quá 15 phút -> Tạo Session (log) mới
		if (!session_id || (now - last_active > SESSION_TIMEOUT_MS)) {
			session_id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
			accDuration = 0;
			localStorage.setItem(SESSION_KEY, session_id);
			localStorage.setItem(DURATION_KEY, '0');
		}

		// Cập nhật last active liên tục
		localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
		let pingStartTime = Date.now();

		// Initial start call
		const visitor_name = localStorage.getItem('quiz_visitor_name') || undefined;
		fetch('/api/track', {
			method: 'POST',
			body: JSON.stringify({ action: 'start', session_id, visitor_id, visitor_name, current_quiz: pageState.moduleId || null })
		}).catch(e => console.error('Tracking Error(start):', e));

		// Ping update loop
		const interval = setInterval(() => {
			const updateNow = Date.now();
			localStorage.setItem(LAST_ACTIVE_KEY, updateNow.toString()); // Gia hạn 15p

			// Cộng dồn duration kể từ lần ping trước (không tính thời gian nháp nếu họ tắt tab 10 phút trước đó)
			const chunkDuration = Math.floor((updateNow - pingStartTime) / 1000);
			pingStartTime = updateNow;
			accDuration += chunkDuration;
			localStorage.setItem(DURATION_KEY, accDuration.toString());

			fetch('/api/track', {
				method: 'POST',
				keepalive: true,
				body: JSON.stringify({ action: 'update', session_id, duration: accDuration, current_quiz: pageState.moduleId || null })
			}).catch(() => {});
		}, 10000); // update every 10 seconds

		// End session capture đóng tab
		window.addEventListener('beforeunload', () => {
			const finishNow = Date.now();
			localStorage.setItem(LAST_ACTIVE_KEY, finishNow.toString());

			const chunkDuration = Math.floor((finishNow - pingStartTime) / 1000);
			accDuration += chunkDuration;
			localStorage.setItem(DURATION_KEY, accDuration.toString());

			navigator.sendBeacon('/api/track', JSON.stringify({ action: 'update', session_id, duration: accDuration, current_quiz: pageState.moduleId || null }));
		});

		return () => clearInterval(interval);
	});
</script>

{#if showVersionModal}
	<NewVersionModal onReload={confirmVersionUpdate} />
{/if}
{@render children()}
