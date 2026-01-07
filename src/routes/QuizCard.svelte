<script lang="ts">
	import { DEBUG } from '$lib/config';
	let isHeld = $state(false);
	import {
		Star,
		ArrowUp,
		ArrowDown,
		Circle,
		CircleDot,
		Square,
		SquareCheck,
		Check,
		X
	} from '@lucide/svelte';

	interface Answer {
		answer_text?: string;
		[key: string]: unknown;
	}

	interface CurrentQuestion {
		question_id?: string;
		module?: string;
		question_text?: string;
		question?: string;
		answers?: Array<{ is_correct: boolean }>;
		question_type: string;
	}

	interface QuizQuestion {
		question_id?: string;
		question_text?: string;
		question_type?: string;
		answers?: unknown[];
		[key: string]: unknown;
	}

	interface Props {
		currentQuestion: CurrentQuestion;
		current: number;
		quizData: QuizQuestion[];
		selectedAnswers: number[];
		questionLocked: boolean;
		checkAnswers: () => void;
		handleAnswerClick: (idx: number, questionType: string) => void;
		favorites: Set<string>;
		toggleFavorite: (idx: number) => void;
		answers: Answer[];
		originalIndices?: number[];
		goToPreviousCard: () => void;
		goToNextCard: () => void;
	}

	let {
		currentQuestion,
		current,
		quizData,
		selectedAnswers,
		questionLocked,
		checkAnswers,
		handleAnswerClick,
		answers,
		originalIndices,
		toggleFavorite,
		favorites,
		goToPreviousCard,
		goToNextCard
	}: Props = $props();

	// Use reactive favorite state from props, not store
	function isFavorited(id: string) {
		return favorites.has(id);
	}

	// Track scroll position and log when reaching edges only once per edge per scroll session
	let scrollContainer: HTMLDivElement | null = null;
	const edgeState = $state({
		topLogged: false,
		bottomLogged: false
	});
	const scrollState = $state<{ value: 'top' | 'middle' | 'bottom' }>({ value: 'top' });
	const isScrollable = $state({ value: false });

	// Improved scroll detection function
	function checkScrollable() {
		if (!scrollContainer) {
			isScrollable.value = false;
			return;
		}
		const { scrollHeight, clientHeight } = scrollContainer;
		// Add small tolerance to account for subpixel rounding
		isScrollable.value = scrollHeight > clientHeight + 1;
	}

	// More reliable scroll detection using ResizeObserver
	let resizeObserver: ResizeObserver | null = null;

	$effect(() => {
		if (!scrollContainer) return;

		// Initial check after component mounts
		checkScrollable();

		// Set up ResizeObserver to detect content changes
		resizeObserver = new ResizeObserver(() => {
			checkScrollable();
		});

		resizeObserver.observe(scrollContainer);

		// Also check after a small delay to catch any late-rendering content
		const timer = setTimeout(() => {
			checkScrollable();
		}, 100);

		return () => {
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
			clearTimeout(timer);
		};
	});

	$effect(() => {
		if (!scrollContainer) return;

		const logCardLoad = () => {
			if (DEBUG) {
				console.log('QuizCard loaded', {
					questionId: currentQuestion?.question_id,
					isScrollable: isScrollable.value
				});
			}
		};

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLDivElement;
			const isAtTop = scrollTop === 0;
			const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

			if (isAtTop) {
				scrollState.value = 'top';
				edgeState.topLogged = true;
			} else if (isAtBottom) {
				scrollState.value = 'bottom';
				edgeState.bottomLogged = true;
			} else {
				scrollState.value = 'middle';
				edgeState.topLogged = false;
				edgeState.bottomLogged = false;
			}
		};

		// Only set up scroll listener if container is scrollable
		if (isScrollable.value) {
			(scrollContainer as HTMLDivElement).addEventListener('scroll', handleScroll);
		}

		// Log for all cards
		setTimeout(logCardLoad, 100);

		return () => {
			const container = scrollContainer as HTMLDivElement;
			container.removeEventListener('scroll', handleScroll);
		};
	});

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

		// Only trigger swipe if it's a significant vertical swipe (< 300ms and > 40px)
		if (Math.abs(deltaY) > 40 && deltaTime < 300) {
			if (deltaY < 0) {
				goToNextCard();
			} else {
				goToPreviousCard();
			}
		}
	}

	// Check if current question is multiple choice
	function isMultipleChoice(): boolean {
		return currentQuestion?.question_type === 'multiple_answer_question';
	}

	// Helper function for answer styling with enhanced feedback
	function getAnswerClass(idx: number): string {
		const isSelected = selectedAnswers.includes(idx);
		const originalIdx = originalIndices?.[idx] ?? idx;
		const isCorrect = currentQuestion?.answers?.[originalIdx]?.is_correct;

		let classes = '';

		if (questionLocked) {
			// After checking: show correct/incorrect/missed states
			if (isCorrect && isSelected) {
				// Correct answer that was selected
				classes += ' border-[var(--color-success)] bg-[var(--color-success)]/10';
			} else if (isCorrect && !isSelected) {
				// Missed correct answer (not selected but should have been)
				classes += ' border-[var(--color-accent)] border-dashed bg-[var(--color-accent)]/5';
			} else if (!isCorrect && isSelected) {
				// Incorrect answer that was selected
				classes += ' border-[var(--color-error)] bg-[var(--color-error)]/10';
			}
		} else if (isSelected) {
			// Before checking: just show selection
			classes += ' border-[var(--color-primary)] bg-[var(--color-primary)]/10';
		}

		return classes;
	}

	// Get the result icon for an answer
	function getAnswerResultIcon(idx: number): 'correct' | 'incorrect' | 'missed' | null {
		if (!questionLocked) return null;

		const isSelected = selectedAnswers.includes(idx);
		const originalIdx = originalIndices?.[idx] ?? idx;
		const isCorrect = currentQuestion?.answers?.[originalIdx]?.is_correct;

		if (isCorrect && isSelected) return 'correct';
		if (isCorrect && !isSelected) return 'missed';
		if (!isCorrect && isSelected) return 'incorrect';
		return null;
	}
</script>

<!-- Quiz Card -->
<div
	bind:this={scrollContainer}
	class="quiz-card main-scrollbar bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl shadow-lg w-[95vw] h-[95%] md:w-[90%] md:h-auto md:max-h-[80vh] px-4 pt-6 pb-4 relative flex flex-col gap-2 touch-pan-y overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--text-secondary)] scrollbar-track-[var(--bg-surface)]"
	style="transform: translateY(0px); transition: none;"
	onmousedown={() => {
		isHeld = true;
		if (DEBUG) {
			console.log('isHeld set to true (mousedown)');
		}
	}}
	onmouseup={() => {
		isHeld = false;
		if (DEBUG) {
			console.log('isHeld set to false (mouseup)');
		}
	}}
	onmouseleave={() => {
		isHeld = false;
		if (DEBUG) {
			console.log('isHeld set to false (mouseleave)');
		}
	}}
	ontouchstart={(e) => {
		isHeld = true;
		if (DEBUG) {
			console.log('isHeld set to true (touchstart)');
		}
		if (!isScrollable.value) handleTouchStart(e);
	}}
	ontouchend={(e) => {
		isHeld = false;
		if (DEBUG) {
			console.log('isHeld set to false (touchend)');
		}
		if (!isScrollable.value) handleTouchEnd(e);
	}}
	role="button"
	tabindex="0"
>
	<!-- Question number and Favorite Button row -->
	<div class="flex items-center justify-between mb-2">
		<span class="text-[var(--text-secondary)] text-base flex items-center gap-2 flex-wrap">
			{#if quizData.length}
				Question {current + 1} / {quizData.length}
				<!-- Question Type Badge -->
				{#if isMultipleChoice()}
					<span
						class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] text-xs font-medium border border-[var(--color-secondary)]/40"
					>
						<SquareCheck size={12} />
						Multiple
					</span>
				{:else}
					<span
						class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--text-secondary)]/15 text-[var(--text-secondary)] text-xs font-medium border border-[var(--text-secondary)]/40"
					>
						<CircleDot size={12} />
						Single
					</span>
				{/if}
				{#if currentQuestion?.module}
					<span
						class="inline-block px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--color-primary)] text-xs font-medium border border-[var(--color-primary)]"
					>
						Module: {currentQuestion.module}
					</span>
				{/if}
				{#if currentQuestion?.question_id}
					<span
						class="inline-block px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--color-accent)] text-xs font-medium border border-[var(--color-accent)]"
					>
						ID: {currentQuestion.question_id}
					</span>
				{/if}
			{/if}
		</span>
		<!-- This is the favorite button -->
		<button
			aria-label="Toggle favorite"
			class="cursor-pointer w-10 h-10 bg-transparent border-none p-0 flex items-center justify-center"
			onclick={() => toggleFavorite(current)}
		>
			{#if isFavorited(currentQuestion?.question_id ?? '')}
				<Star fill="var(--color-accent)" color="var(--color-accent)" size={32} />
			{:else}
				<Star color="var(--text-primary)" size={32} />
			{/if}
		</button>
	</div>
	<!-- Question Text -->
	<div class="question-row font-semibold text-lg mb-4">
		{#if currentQuestion}
			{currentQuestion.question_text || currentQuestion.question || ''}
		{:else}
			{quizData.length === 0 ? 'Please select a module to begin.' : ''}
		{/if}
	</div>
	<!-- Answers List -->
	<div class="answers-row flex flex-col gap-3 mb-4">
		{#if currentQuestion}
			{#each answers as ans, idx (idx)}
				{@const resultIcon = getAnswerResultIcon(idx)}
				{@const isSelected = selectedAnswers.includes(idx)}
				<button
					type="button"
					class="answer relative flex items-start gap-3 px-4 py-3 rounded-lg border-2 border-[var(--border)] bg-[var(--bg-hover)] text-base text-[var(--text-primary)] cursor-pointer transition-all duration-200 text-left break-words {getAnswerClass(
						idx
					)}"
					disabled={questionLocked}
					onclick={() => {
						if (DEBUG) {
							console.log('[QuizCard] Answer button clicked', {
								idx,
								questionLocked,
								selectedAnswers,
								questionType: currentQuestion.question_type
							});
						}
						handleAnswerClick(idx, currentQuestion.question_type ?? 'single');
					}}
					aria-pressed={selectedAnswers.includes(idx)}
					aria-label={'Answer ' + (idx + 1)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							if (DEBUG) {
								console.log('[QuizCard] Answer button keydown', {
									idx,
									questionLocked,
									selectedAnswers,
									questionType: currentQuestion.question_type
								});
							}
							handleAnswerClick(idx, currentQuestion.question_type ?? 'single');
						}
					}}
				>
					<!-- Selection Indicator (Radio/Checkbox) -->
					<span class="flex-shrink-0 mt-0.5">
						{#if isMultipleChoice()}
							{#if isSelected}
								<SquareCheck size={20} class="text-[var(--color-primary)]" />
							{:else}
								<Square size={20} class="text-[var(--text-secondary)]" />
							{/if}
						{:else if isSelected}
							<CircleDot size={20} class="text-[var(--color-primary)]" />
						{:else}
							<Circle size={20} class="text-[var(--text-secondary)]" />
						{/if}
					</span>

					<!-- Answer Text -->
					<span class="flex-1">{ans.answer_text || ans}</span>

					<!-- Result Icon (after checking) -->
					{#if resultIcon}
						<span class="flex-shrink-0 mt-0.5">
							{#if resultIcon === 'correct'}
								<Check size={20} class="text-[var(--color-success)]" />
							{:else if resultIcon === 'incorrect'}
								<X size={20} class="text-[var(--color-error)]" />
							{:else if resultIcon === 'missed'}
								<span class="text-[var(--color-accent)] text-xs font-medium">Missed</span>
							{/if}
						</span>
					{/if}
				</button>
			{/each}
		{/if}
	</div>
	<!-- Check Button (MCQ only) -->
	{#if isMultipleChoice() && !questionLocked}
		<div class="flex flex-col items-center w-full gap-2">
			<!-- Selection counter -->
			{#if selectedAnswers.length > 0}
				<span class="text-sm text-[var(--text-secondary)]">
					{selectedAnswers.length} answer{selectedAnswers.length !== 1 ? 's' : ''} selected
				</span>
			{:else}
				<span class="text-sm text-[var(--text-secondary)] opacity-70">
					Select one or more answers
				</span>
			{/if}
			<button
				id="check-btn"
				class="mt-1 mb-4 px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200
					{selectedAnswers.length > 0
					? 'bg-[var(--color-primary)] text-[var(--bg-primary)] shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-[var(--color-primary)]/40 hover:scale-[1.02] active:scale-[0.98]'
					: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-not-allowed opacity-50'}"
				onclick={checkAnswers}
				disabled={selectedAnswers.length === 0}
			>
				Check Answers
			</button>
		</div>
	{/if}
</div>

{#if isScrollable.value}
	<button
		type="button"
		class="md:hidden fixed bottom-28 left-1/2 -translate-x-1/2 z-10 w-16 h-16 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border-2 border-[var(--color-primary)] shadow-lg transition-opacity duration-200
              {scrollState.value === 'top' && !isHeld
			? 'opacity-100'
			: 'opacity-0 pointer-events-none'}"
		aria-label="Go to previous card"
		onclick={goToPreviousCard}
	>
		<ArrowUp class="w-8 h-8 text-[var(--color-primary)]" />
	</button>
	<button
		type="button"
		class="md:hidden fixed bottom-28 left-1/2 -translate-x-1/2 z-10 w-16 h-16 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border-2 border-[var(--color-primary)] shadow-lg transition-opacity duration-200
							{scrollState.value === 'bottom' && isScrollable.value && current < quizData.length - 1 && !isHeld
			? 'opacity-100'
			: 'opacity-0 pointer-events-none'}"
		aria-label="Go to next card"
		onclick={goToNextCard}
	>
		<ArrowDown class="w-8 h-8 text-[var(--color-primary)]" />
	</button>
{/if}
