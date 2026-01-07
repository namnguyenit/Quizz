<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import TopBar from './TopBar.svelte';
	import Carousel from './Carousel.svelte';
	import FavoritesModal from './FavoritesModal.svelte';
	import {
		DEFAULT_FAVORITES_LOCAL,
		FAVORITES_LOCAL_KEY,
		CURRENT_VIEW_KEY,
		FAVORITE_QUESTIONS_KEY,
		APPSTATE_ALL_KEY
	} from '../lib/localKeys';
	import type { Quiz } from './global.svelte';
	import {
		pageState,
		favorites,
		appState,
		uiState,
		setCurrentView,
		fetchNavigation,
		loadQuiz
	} from './global.svelte';

	let isInitialLoad = $state(true);

	async function showFavorites() {
		if (typeof window !== 'undefined') {
			localStorage.setItem(CURRENT_VIEW_KEY, 'favorites');
			setCurrentView('favorites');
			const favQuestionsRaw = localStorage.getItem(FAVORITE_QUESTIONS_KEY);
			const favIdsArr = favQuestionsRaw ? JSON.parse(favQuestionsRaw) : [];
			if (!Array.isArray(favIdsArr) || favIdsArr.length === 0) {
				pageState.quizData = [];
				pageState.current = 0;
			} else {
				pageState.isLoading = true;
				const res = await fetch('/api/module', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ ids: favIdsArr })
				});
				const data = await res.json();
				pageState.quizData = Array.isArray(data.quizzes)
					? data.quizzes.filter((q: Quiz) => q.status !== 'all_false')
					: [];
				pageState.isLoading = false;
				pageState.current = 0;
			}
		}
	}

	function onBackToAll() {
		if (typeof window !== 'undefined') {
			localStorage.setItem(CURRENT_VIEW_KEY, 'all');
			setCurrentView('all');
			uiState.sidebarMode = 'library';
		}
	}

	function onClearFavorites() {
		favorites.clear();
		if (typeof window !== 'undefined') {
			localStorage.setItem(FAVORITE_QUESTIONS_KEY, '[]');
		}
		if (appState.currentView === 'favorites') {
			setCurrentView('all');
			uiState.sidebarMode = 'library';
		}
	}

	function handleKeyNavigation(e: KeyboardEvent) {
		if (
			document.activeElement &&
			['INPUT', 'SELECT', 'TEXTAREA'].includes((document.activeElement as HTMLElement).tagName)
		)
			return;
		if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
			if (pageState.current < pageState.quizData.length - 1) {
				pageState.current += 1;
				pageState.questionAnswers.clear();
				pageState.questionLocked = false;
			}
		} else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
			if (pageState.current > 0) {
				pageState.current -= 1;
				pageState.questionAnswers.clear();
				pageState.questionLocked = false;
			}
		}
	}

	$effect(() => {
		window.addEventListener('keydown', handleKeyNavigation);
		if (isInitialLoad) {
			fetchNavigation();
			if (appState.currentView === 'favorites') {
				showFavorites();
			}
			isInitialLoad = false;
		}
		return () => window.removeEventListener('keydown', handleKeyNavigation);
	});

	// Auto-save favorites to localStorage when they change
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(FAVORITE_QUESTIONS_KEY, JSON.stringify(Array.from(favorites)));
		}
	});

	// Auto-save current state
	$effect(() => {
		if (typeof window !== 'undefined' && appState.currentView === 'all' && pageState.moduleId) {
			localStorage.setItem(
				APPSTATE_ALL_KEY,
				JSON.stringify({
					module: pageState.moduleId,
					questionIndex: pageState.current
				})
			);
		}
	});

	// Initial load state restoration
	if (typeof window !== 'undefined') {
		const favArr = JSON.parse(localStorage.getItem(FAVORITE_QUESTIONS_KEY) || '[]');
		favorites.clear();
		for (const id of favArr) favorites.add(id);
		const currentView = (localStorage.getItem(CURRENT_VIEW_KEY) as 'all' | 'favorites') || 'all';
		setCurrentView(currentView);
	}
</script>

<!-- Main Layout -->
<div
	class="flex min-h-screen min-w-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans"
>
	<!-- Sidebar -->
	{#if uiState.sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 768)}
		<div
			class="fixed top-0 left-0 h-full z-40 bg-[var(--bg-surface)] transition-transform duration-200 ease-in-out
							md:static md:translate-x-0 md:min-w-[200px] md:w-[300px]"
		>
			<Sidebar />
		</div>
	{/if}

	<!-- Backdrop -->
	{#if uiState.sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768}
		<button
			type="button"
			class="fixed inset-0 bg-black/50 z-30"
			onclick={() => (uiState.sidebarOpen = false)}
			aria-label="Close sidebar"
		></button>
	{/if}

	<!-- Main Content Wrapper -->
	<div id="main-content-wrapper" class="flex-1 flex flex-col min-h-0 min-w-0">
		<!-- Top Bar -->
		<div class="w-full relative z-10 flex-shrink-0">
			{#if typeof window !== 'undefined'}
				<TopBar {showFavorites} {onBackToAll} {onClearFavorites} />
			{/if}
		</div>
		<!-- Main Content -->
		<div id="main-content" class="flex-1 flex flex-col items-center justify-start relative">
			{#if pageState.isLoading}
				<!-- Loading Overlay -->
				<div
					class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 pointer-events-auto select-none"
				>
					<svg
						class="animate-spin h-16 w-16 text-[var(--color-primary)]"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
						></path>
					</svg>
				</div>
			{/if}
			<div
				class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden md:items-start md:justify-center"
			>
				<Carousel />
			</div>
		</div>
	</div>
	<!-- Floating Favorites ID Button and Modal -->
	<button
		id="fav-id-fab"
		class="cursor-pointer fav-id-fab fixed bottom-6 right-6 z-[1000] bg-[var(--color-primary)] text-[var(--bg-primary)] rounded-full w-14 h-14 shadow-lg text-2xl flex items-center justify-center hover:opacity-80"
		onclick={() => (uiState.showFavModal = true)}
	>
		★
	</button>
	<FavoritesModal />
</div>
