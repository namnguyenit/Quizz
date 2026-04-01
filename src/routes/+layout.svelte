<script lang="ts">
	import { dev } from '$app/environment';
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
	import { styleState, setStyle, setFont } from './global.svelte';
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
		
		const session_id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
		const startTime = Date.now();

		// Initial start call
		fetch('/api/track', {
			method: 'POST',
			body: JSON.stringify({ action: 'start', session_id })
		}).catch(e => console.error('Tracking Error(start):', e));

		// Ping update loop
		const interval = setInterval(() => {
			const duration = Math.floor((Date.now() - startTime) / 1000);
			fetch('/api/track', {
				method: 'POST',
				keepalive: true,
				body: JSON.stringify({ action: 'update', session_id, duration })
			}).catch(() => {});
		}, 10000); // update every 10 seconds

		// End session capture
		window.addEventListener('beforeunload', () => {
			const duration = Math.floor((Date.now() - startTime) / 1000);
			navigator.sendBeacon('/api/track', JSON.stringify({ action: 'update', session_id, duration }));
		});

		return () => clearInterval(interval);
	});
</script>

{#if showVersionModal}
	<NewVersionModal onReload={confirmVersionUpdate} />
{/if}
{@render children()}
