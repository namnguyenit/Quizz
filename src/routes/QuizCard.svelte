<script lang="ts">
	import { DEBUG } from '$lib/config';
	import BilingualText from '$lib/components/BilingualText.svelte';
	import { untrack } from 'svelte';
	let isHeld = $state(false);
	
	import Prism from 'prismjs';
	import 'prismjs/themes/prism-tomorrow.css';
	import 'prismjs/components/prism-c';
	import 'prismjs/components/prism-java';

	let codeElement = $state<HTMLElement | null>(null);

	$effect(() => {
		if (codeElement && currentQuestion?.code) {
			codeElement.textContent = currentQuestion.code;
			Prism.highlightElement(codeElement);
		}
	});
	import {
		Star,
		Circle,
		CircleDot,
		Square,
		SquareCheck,
		Check,
		X,
		ChevronLeft,
		ChevronRight
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
		image_url?: string | null;
		code?: string | null;
	}

	interface QuizQuestion {
		question_id?: string;
		question_text?: string;
		question_type?: string;
		answers?: unknown[];
		code?: string | null;
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

	let hasBlockedBottomSwipe = $state(false);
	let hasBlockedTopSwipe = $state(false);

	let transitionHint = $state<{ show: boolean; text: string; direction: 'next' | 'prev' | null }>({
		show: false,
		text: '',
		direction: null
	});
	let hintTimeout: number | null = null;

	function showTransitionHint(direction: 'next' | 'prev') {
		if (hintTimeout) {
			clearTimeout(hintTimeout);
		}
		transitionHint = {
			show: true,
			text: direction === 'next' 
				? 'Vuốt thêm lần nữa để sang câu tiếp theo' 
				: 'Vuốt thêm lần nữa để về câu trước',
			direction
		};
		hintTimeout = setTimeout(() => {
			transitionHint.show = false;
		}, 1800) as unknown as number;
	}

	$effect(() => {
		// Reset block states and hints when question index changes
		const _ = current;
		untrack(() => {
			hasBlockedBottomSwipe = false;
			hasBlockedTopSwipe = false;
			transitionHint.show = false;
			if (hintTimeout) {
				clearTimeout(hintTimeout);
				hintTimeout = null;
			}
		});
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

			// Reset block flags when user scrolls away from edges
			if (scrollTop + clientHeight < scrollHeight - 15) {
				hasBlockedBottomSwipe = false;
			}
			if (scrollTop > 15) {
				hasBlockedTopSwipe = false;
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
	let startedAtTop = false;
	let startedAtBottom = false;

	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
		touchStartTime = Date.now();
		
		if (scrollContainer) {
			const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
			// Use a 2px tolerance for subpixel rounding issues
			startedAtTop = scrollTop <= 2;
			startedAtBottom = scrollTop + clientHeight >= scrollHeight - 2;
		} else {
			startedAtTop = true;
			startedAtBottom = true;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		touchEndY = e.changedTouches[0].clientY;
		const deltaY = touchEndY - touchStartY;
		const deltaTime = Date.now() - touchStartTime;

		// Vertical swipe gesture detection (swipe up for Next, swipe down for Prev)
		if (deltaTime < 300 && Math.abs(deltaY) > 50) {
			if (deltaY < 0) {
				// Swipe up -> Next question
				if (isScrollable.value) {
					if (startedAtBottom) {
						if (!hasBlockedBottomSwipe) {
							hasBlockedBottomSwipe = true;
							showTransitionHint('next');
						} else {
							goToNextCard();
						}
					}
				} else {
					// Non-scrollable: transition immediately
					goToNextCard();
				}
			} else {
				// Swipe down -> Previous question
				if (isScrollable.value) {
					if (startedAtTop) {
						if (!hasBlockedTopSwipe) {
							hasBlockedTopSwipe = true;
							showTransitionHint('prev');
						} else {
							goToPreviousCard();
						}
					}
				} else {
					// Non-scrollable: transition immediately
					goToPreviousCard();
				}
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
	class="w-full h-full flex flex-col overflow-hidden"
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
		handleTouchStart(e);
	}}
	ontouchend={(e) => {
		isHeld = false;
		if (DEBUG) {
			console.log('isHeld set to false (touchend)');
		}
		handleTouchEnd(e);
	}}
	role="button"
	tabindex="0"
>
	<!-- Content wrapper with max-width for readability -->
	<div
		bind:this={scrollContainer}
		class="max-w-4xl mx-auto w-full px-4 py-6 md:px-12 md:py-12 flex-1 flex flex-col overflow-y-auto main-scrollbar text-[var(--text-primary)]"
		onwheel={(e) => {
			// Block scroll wheel navigation when card is scrollable
			// Navigation will be handled by explicit buttons at edges
			if (isScrollable.value) {
				e.stopPropagation();
			}
		}}
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
		<!-- Question Image -->
		{#if currentQuestion?.image_url}
			<div class="question-image mb-4">
				<img
					src={currentQuestion.image_url}
					alt="Question illustration"
					class="w-full max-h-64 object-contain rounded-lg"
					loading="lazy"
				/>
			</div>
		{/if}
		<!-- Question Text -->
		<div class="question-row text-lg mb-4">
			{#if currentQuestion}
				<BilingualText
					text={currentQuestion.question_text || currentQuestion.question || ''}
					variant="question"
				/>
			{:else}
				{quizData.length === 0 ? 'Please select a module to begin.' : ''}
			{/if}
		</div>
		<!-- Question Code Block -->
		{#if currentQuestion?.code}
			<div class="question-code shrink-0 mb-4 overflow-hidden rounded-lg border border-[#2d2d2d] bg-[#1e1e1e] shadow-lg">
				<div class="flex items-center justify-between px-4 py-2 border-b border-[#2d2d2d] bg-[#252526] text-xs text-[#858585] font-mono select-none">
					<div class="flex items-center gap-2">
						<span class="w-3 h-3 rounded-full bg-[#ff5f56]"></span>
						<span class="w-3 h-3 rounded-full bg-[#ffbd2e]"></span>
						<span class="w-3 h-3 rounded-full bg-[#27c93f]"></span>
						<span class="ml-2 text-xs">code_snippet.c</span>
					</div>
				</div>
				<pre class="!p-4 !pb-6 !m-0 overflow-x-auto text-sm font-mono leading-relaxed !bg-[#1e1e1e] main-scrollbar"><code bind:this={codeElement} class="language-c">{currentQuestion.code}</code></pre>
			</div>
		{/if}
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
						<span class="flex-1">
							<BilingualText text={ans.answer_text || String(ans)} variant="answer" />
						</span>

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

<!-- Mobile Bottom Navigation Bar (Persistent, Sticky) -->
<div class="md:hidden flex items-center justify-between gap-3 px-4 py-3.5 bg-[var(--bg-surface)] border-t border-[var(--border)] z-20 w-full flex-shrink-0">
	<!-- Prev Button -->
	<button
		type="button"
		class="flex-1 max-w-[85px] flex items-center justify-center gap-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--border)] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
		onclick={goToPreviousCard}
		disabled={current === 0}
	>
		<ChevronLeft size={16} />
		<span>Prev</span>
	</button>

	<!-- Progress Indicator -->
	<div class="flex-1 flex flex-col items-center">
		<span class="text-[10px] text-[var(--text-secondary)] font-bold tracking-wider uppercase">
			Question {current + 1} of {quizData.length}
		</span>
		<div class="w-full max-w-[120px] bg-[var(--border)] h-2 rounded-full mt-1 overflow-hidden shadow-inner">
			<div class="bg-[var(--color-primary)] h-full transition-all duration-300 rounded-full" style="width: {((current + 1) / quizData.length) * 100}%"></div>
		</div>
	</div>

	<!-- Primary Action Button (Check or Next) -->
	{#if isMultipleChoice() && !questionLocked}
		<button
			type="button"
			class="flex-1 max-w-[110px] py-2.5 rounded-xl font-bold text-sm transition-all text-center cursor-pointer
			{selectedAnswers.length > 0
				? 'bg-[var(--color-primary)] text-[var(--bg-primary)] shadow-md active:scale-95'
				: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed'}"
			onclick={checkAnswers}
			disabled={selectedAnswers.length === 0}
		>
			Check
		</button>
	{:else}
		<button
			type="button"
			class="flex-1 max-w-[110px] flex items-center justify-center gap-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--bg-primary)] text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
			onclick={goToNextCard}
			disabled={current === quizData.length - 1}
		>
			<span>Next</span>
			<ChevronRight size={16} />
		</button>
	{/if}
</div>

{#if isScrollable.value}
	<!-- Desktop: Text-based navigation buttons above FAB area -->
	{#if scrollState.value === 'top' && current > 0}
		<button
			type="button"
			class="hidden md:flex fixed bottom-24 right-6 z-10 items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-primary)] border border-[var(--color-primary)] shadow-xl text-[var(--bg-primary)] font-medium text-base hover:opacity-90 transition-all duration-200 cursor-pointer"
			aria-label="Go to previous question"
			onclick={goToPreviousCard}
		>
			<ChevronLeft size={20} />
			<span>Previous Question</span>
		</button>
	{/if}
	{#if scrollState.value === 'bottom' && current < quizData.length - 1}
		<button
			type="button"
			class="hidden md:flex fixed bottom-24 right-6 z-10 items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-primary)] border border-[var(--color-primary)] shadow-xl text-[var(--bg-primary)] font-medium text-base hover:opacity-90 transition-all duration-200 cursor-pointer"
			aria-label="Go to next question"
			onclick={goToNextCard}
		>
			<span>Next Question</span>
			<ChevronRight size={20} />
		</button>
	{/if}
{/if}

<!-- Safety transition hint pill on swipe block -->
{#if transitionHint.show}
	<div class="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100">
		<div class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--bg-primary)] text-sm font-semibold shadow-xl shadow-[var(--color-primary)]/10 backdrop-blur-md border border-[var(--color-primary)]/20 animate-bounce">
			{#if transitionHint.direction === 'next'}
				<span>{transitionHint.text}</span>
				<ChevronRight size={16} />
			{:else}
				<ChevronLeft size={16} />
				<span>{transitionHint.text}</span>
			{/if}
		</div>
	</div>
{/if}
</div>
