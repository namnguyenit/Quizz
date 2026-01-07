<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import TopBar from './TopBar.svelte';
	import Carousel from './Carousel.svelte';
	import LibraryGrid from './LibraryGrid.svelte';
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

	// Store previous quiz state before entering favorites
	let previousQuizState = $state<{
		quizData: Quiz[];
		moduleId: string;
		current: number;
	} | null>(null);

	// Confirmation modal state
	let showClearConfirm = $state(false);

	async function showFavorites() {
		if (typeof window !== 'undefined') {
			// Save current quiz state before switching to favorites
			if (pageState.quizData.length > 0 && appState.currentView === 'all') {
				previousQuizState = {
					quizData: [...pageState.quizData],
					moduleId: pageState.moduleId,
					current: pageState.current
				};
			}

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

			// Restore previous quiz state if it exists
			if (previousQuizState) {
				pageState.quizData = previousQuizState.quizData;
				pageState.moduleId = previousQuizState.moduleId;
				pageState.current = previousQuizState.current;
				uiState.sidebarMode = 'questions';
				previousQuizState = null;
			} else {
				// No previous quiz, go to library
				pageState.quizData = [];
				pageState.moduleId = '';
				uiState.sidebarMode = 'library';
			}
		}
	}

	function onClearFavorites() {
		showClearConfirm = true;
	}

	function confirmClearFavorites() {
		favorites.clear();
		if (typeof window !== 'undefined') {
			localStorage.setItem(FAVORITE_QUESTIONS_KEY, '[]');
		}
		if (appState.currentView === 'favorites') {
			localStorage.setItem(CURRENT_VIEW_KEY, 'all');
			setCurrentView('all');

			// Restore previous quiz state if it exists
			if (previousQuizState) {
				pageState.quizData = previousQuizState.quizData;
				pageState.moduleId = previousQuizState.moduleId;
				pageState.current = previousQuizState.current;
				uiState.sidebarMode = 'questions';
				previousQuizState = null;
			} else {
				// No previous quiz, go to library
				pageState.quizData = [];
				pageState.moduleId = '';
				uiState.sidebarMode = 'library';
			}
		}
		showClearConfirm = false;
	}

	function cancelClearFavorites() {
		showClearConfirm = false;
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
	<!-- Sidebar (only show when quiz is loaded) -->
	{#if uiState.sidebarOpen && pageState.quizData.length > 0}
		<div
			class="fixed top-0 left-0 h-full z-40 bg-[var(--bg-surface)] transition-transform duration-200 ease-in-out
							md:static md:translate-x-0 md:min-w-[200px] md:w-[300px]"
		>
			<Sidebar />
		</div>
	{/if}

	<!-- Backdrop (mobile only) -->
	{#if uiState.sidebarOpen && pageState.quizData.length > 0 && typeof window !== 'undefined' && window.innerWidth < 768}
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
		<div
			id="main-content"
			class="flex-1 flex flex-col items-center justify-start relative overflow-hidden"
		>
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

			{#if pageState.quizData.length > 0}
				<!-- Quiz View -->
				<div
					class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden md:items-start md:justify-center"
				>
					<Carousel />
				</div>
			{:else if appState.currentView === 'all'}
				<!-- Library View -->
				<LibraryGrid />
			{:else}
				<!-- Favorites empty state -->
				<div class="w-full h-full flex flex-col items-center justify-center p-8">
					<div class="text-[var(--text-secondary)] text-lg mb-4">No favorite questions yet</div>
					<p class="text-[var(--text-secondary)] text-sm text-center mb-6 max-w-md">
						Star questions while taking quizzes to save them here for quick review
					</p>
					<button
						class="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--bg-primary)] font-semibold"
						onclick={() => {
							setCurrentView('all');
						}}
					>
						Browse Quizzes
					</button>
				</div>
			{/if}
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

	<!-- Clear Favorites Confirmation Modal -->
	{#if showClearConfirm}
		<div class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
			<div
				class="bg-[var(--bg-surface)] rounded-xl p-6 max-w-sm mx-4 shadow-2xl border border-[var(--border)]"
			>
				<h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">Clear all favorites?</h3>
				<p class="text-[var(--text-secondary)] text-sm mb-6">
					This will remove all your favorited questions. This cannot be undone.
				</p>
				<div class="flex gap-3 justify-end">
					<button
						class="px-4 py-2 rounded-lg bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium hover:bg-[var(--border)] transition-colors"
						onclick={cancelClearFavorites}
					>
						Cancel
					</button>
					<button
						class="px-4 py-2 rounded-lg bg-[var(--color-error)] text-white font-medium hover:opacity-90 transition-opacity"
						onclick={confirmClearFavorites}
					>
						Clear All
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
