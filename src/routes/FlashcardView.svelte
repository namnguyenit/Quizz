<script lang="ts">
	import { pageState } from './global.svelte';
	import { ChevronLeft, ChevronRight, RotateCcw } from '@lucide/svelte';

	let isFlipped = $state(false);

	const currentCard = $derived(pageState.flashcardData[pageState.current]);
	const totalCards = $derived(pageState.flashcardData.length);

	function prevCard() {
		if (pageState.current > 0) {
			isFlipped = false;
			setTimeout(() => {
				pageState.current--;
			}, 150);
		}
	}

	function nextCard() {
		if (pageState.current < totalCards - 1) {
			isFlipped = false;
			setTimeout(() => {
				pageState.current++;
			}, 150);
		}
	}

	function flipCard() {
		isFlipped = !isFlipped;
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') prevCard();
		if (e.key === 'ArrowRight') nextCard();
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			flipCard();
		}
	}

	let touchStartY = 0;
	let touchEndY = 0;
	let touchStartTime = 0;

	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
		touchStartTime = Date.now();
	}

	function handleTouchEnd(e: TouchEvent) {
		touchEndY = e.changedTouches[0].clientY;
		const deltaY = touchEndY - touchStartY;
		const deltaTime = Date.now() - touchStartTime;

		// Vertical swipe gesture detection (swipe up for Next, swipe down for Prev)
		if (deltaTime < 300 && Math.abs(deltaY) > 50) {
			if (deltaY < 0) {
				nextCard();
			} else {
				prevCard();
			}
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="flex flex-col items-center justify-center w-full h-full p-4 md:p-8">
	{#if currentCard}
		<div class="mb-6 flex justify-between items-center w-full max-w-xl">
			<span class="text-[var(--text-secondary)] font-medium">Card {pageState.current + 1} of {totalCards}</span>
		</div>

		<!-- Flashcard Container -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="relative w-full max-w-xl aspect-[4/3] md:aspect-[3/2] cursor-pointer perspective-1000"
			onclick={flipCard}
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
		>
			<div 
				class="w-full h-full duration-500 preserve-3d relative"
				style="transform: {isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'};"
			>
				<!-- Front Side -->
				<div class="absolute inset-0 backface-hidden w-full h-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 text-center hover:border-[var(--color-primary)] transition-colors overflow-y-auto">
					{#if currentCard.image_url}
						<!-- svelte-ignore a11y_missing_attribute -->
						<img src={currentCard.image_url} class="max-h-48 object-contain mb-4 rounded-lg" />
					{/if}
					<h2 class="text-2xl md:text-4xl font-bold text-[var(--text-primary)]" style="font-family: var(--font-family, inherit)">
						{currentCard.front_text}
					</h2>
					<div class="absolute bottom-4 right-4 text-[var(--text-secondary)] opacity-50 flex items-center gap-1 text-sm">
						Click to flip
						<RotateCcw size={16} />
					</div>
				</div>

				<!-- Back Side -->
				<div class="absolute inset-0 backface-hidden w-full h-full bg-[var(--bg-surface)] border-2 border-[var(--color-primary)] rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 text-center rotate-y-180 overflow-y-auto">
					{#if currentCard.pronunciation}
						<div class="text-[var(--color-accent)] font-medium mb-4 text-lg md:text-xl">{currentCard.pronunciation}</div>
					{/if}
					<h2 class="text-xl md:text-3xl font-semibold text-[var(--text-primary)]" style="font-family: var(--font-family, inherit)">
						{currentCard.back_text}
					</h2>
				</div>
			</div>
		</div>

		<!-- Controls -->
		<div class="flex items-center gap-8 mt-12">
			<button 
				class="p-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
				onclick={prevCard}
				disabled={pageState.current === 0}
				aria-label="Previous card"
			>
				<ChevronLeft size={28} />
			</button>

			<button 
				class="px-8 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--bg-primary)] font-bold shadow-md hover:opacity-90 transition-opacity"
				onclick={flipCard}
			>
				{isFlipped ? 'Show Front' : 'Show Back'}
			</button>

			<button 
				class="p-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
				onclick={nextCard}
				disabled={pageState.current === totalCards - 1}
				aria-label="Next card"
			>
				<ChevronRight size={28} />
			</button>
		</div>
	{:else}
		<div class="text-xl text-[var(--text-secondary)]">No flashcards found or loading...</div>
	{/if}
</div>

<style>
	.perspective-1000 {
		perspective: 1000px;
	}
	.preserve-3d {
		transform-style: preserve-3d;
	}
	.backface-hidden {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}
	.rotate-y-180 {
		transform: rotateY(180deg);
	}
</style>
