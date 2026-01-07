<script lang="ts">
	import { uiState, appState, pageState, styleState, setStyle, setFont } from './global.svelte';
	import { ChevronRight } from '@lucide/svelte';
	import { STYLES, FONTS, type StyleKey, type FontId } from '$lib/theme';

	interface Props {
		showFavorites: () => void;
		onBackToAll: () => void;
		onClearFavorites: () => void;
	}

	let { showFavorites, onBackToAll, onClearFavorites }: Props = $props();

	function handleFavoritesClick() {
		showFavorites();
	}
	function handleBackClick() {
		if (onBackToAll) {
			onBackToAll();
		}
	}
	function handleClearFavorites() {
		if (onClearFavorites) {
			onClearFavorites();
		}
	}

	function handleStyleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		setStyle(target.value as StyleKey);
	}

	function handleFontChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		setFont(target.value as FontId);
	}

	let currentSubject = $derived(
		uiState.navigation.find((s) => s.quizzes.some((q) => q.id === pageState.moduleId))
	);
	let currentQuiz = $derived(currentSubject?.quizzes.find((q) => q.id === pageState.moduleId));
</script>

<div
	class="top-bar flex flex-row items-center justify-between px-6 py-4 flex-shrink-0 bg-[var(--bg-surface)] border-b border-[var(--border)]"
>
	<div class="flex items-center">
		<!-- Hamburger -->
		{#if typeof window !== 'undefined' && window.innerWidth < 768 && !uiState.sidebarOpen}
			<button
				class="hamburger-btn mr-4 bg-[var(--color-primary)] rounded-lg p-2"
				aria-label="Open sidebar"
				onclick={() => (uiState.sidebarOpen = true)}
			>
				<span class="block w-6 h-[3px] bg-[var(--bg-primary)] my-1"></span>
				<span class="block w-6 h-[3px] bg-[var(--bg-primary)] my-1"></span>
				<span class="block w-6 h-[3px] bg-[var(--bg-primary)] my-1"></span>
			</button>
		{/if}

		<!-- Breadcrumbs -->
		<div class="flex items-center gap-2 text-sm md:text-base font-medium overflow-hidden">
			{#if currentSubject}
				<span class="text-[var(--text-secondary)] whitespace-nowrap">{currentSubject.name}</span>
				<ChevronRight size={16} class="text-[var(--border)] flex-shrink-0" />
				<span class="text-[var(--color-primary)] font-bold truncate"
					>{currentQuiz?.name || 'Quiz'}</span
				>
			{:else if appState.currentView === 'favorites'}
				<span class="text-[var(--color-primary)] font-bold">Favorites</span>
			{:else}
				<span class="text-[var(--color-primary)] font-bold">Select a Quiz</span>
			{/if}
		</div>
	</div>

	<div class="flex gap-2 items-center">
		<!-- Style/Font Selectors (hidden on mobile) -->
		<div class="hidden md:flex gap-2 items-center">
			<select
				class="style-select"
				value={styleState.style}
				onchange={handleStyleChange}
				aria-label="Select style"
			>
				{#each Object.entries(STYLES) as [key, style] (key)}
					<option value={key}>{style.name}</option>
				{/each}
			</select>

			<select
				class="font-select"
				value={styleState.font}
				onchange={handleFontChange}
				aria-label="Select font"
			>
				{#each FONTS as font (font.id)}
					<option value={font.id}>{font.name}</option>
				{/each}
			</select>
		</div>

		{#if appState.currentView === 'all'}
			<button
				class="cursor-pointer rounded-md px-3 py-1.5 bg-[var(--color-primary)] text-[var(--bg-primary)] text-sm font-bold transition-transform active:scale-95"
				onclick={handleFavoritesClick}
			>
				Favorites
			</button>
		{:else}
			<button
				class="cursor-pointer rounded-md px-3 py-1.5 bg-[var(--color-primary)] text-[var(--bg-primary)] text-sm font-bold transition-transform active:scale-95"
				onclick={handleBackClick}
			>
				Back
			</button>
			<button
				class="cursor-pointer rounded-md px-3 py-1.5 bg-[var(--bg-hover)] text-[var(--color-error)] text-sm font-bold border border-[var(--color-error)] transition-transform active:scale-95"
				onclick={handleClearFavorites}
			>
				Clear
			</button>
		{/if}
	</div>
</div>
