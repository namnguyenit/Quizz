<script lang="ts">
	import { DEBUG } from '$lib/config';
	import QuizCard from './QuizCard.svelte';
	import ReadingQuestionPanel from './ReadingQuestionPanel.svelte';
	import { pageState, favorites, appState } from './global.svelte';

	interface CurrentQuestion {
		question_id?: string;
		question_text?: string;
		answers?: Array<{ is_correct: boolean }>;
		question_type: string;
		image_url?: string | null;
		section?: string;
		reading_title?: string | null;
		reading_passage?: string | null;
		reading_type?: string | null;
	}

	function getCurrentQuestionWithType(q: Record<string, unknown>): CurrentQuestion {
		return {
			question_id: typeof q.question_id === 'string' ? q.question_id : '',
			question_text: typeof q.question_text === 'string' ? q.question_text : '',
			answers: Array.isArray(q.answers) ? (q.answers as Array<{ is_correct: boolean }>) : [],
			question_type: typeof q.question_type === 'string' ? (q.question_type as string) : 'single',
			image_url: typeof q.image_url === 'string' ? q.image_url : null,
			section: typeof q.section === 'string' ? q.section : undefined,
			reading_title: typeof q.reading_title === 'string' ? q.reading_title : null,
			reading_passage: typeof q.reading_passage === 'string' ? q.reading_passage : null,
			reading_type: typeof q.reading_type === 'string' ? q.reading_type : null
		};
	}
	function shuffleArray<T>(array: T[]): T[] {
		const arr = array.slice();
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function isReadingQuestion(idx: number): boolean {
		return (pageState.quizData[idx]?.section as string | undefined) === 'reading';
	}

	/* Store shuffled answers and mapping for each question index */
	let shuffledAnswers = $state<{ [idx: number]: { answer_text: string }[] }>({});
	let shuffledIndices = $state<{ [idx: number]: number[] }>({});

	function getAnswers(idx: number): { answer_text: string }[] {
		return shuffledAnswers[idx] ?? [];
	}

	function getOriginalIndex(idx: number, shuffledIdx: number): number {
		return shuffledIndices[idx]?.[shuffledIdx] ?? shuffledIdx;
	}

	$effect(() => {
		const idx = pageState.current;
		const answers = Array.isArray(pageState.quizData[idx]?.answers)
			? pageState.quizData[idx].answers.map((a: string | { answer_text: string }) =>
					typeof a === 'object' && a !== null ? a : { answer_text: String(a) }
				)
			: [];
		const indices = answers.map((_, i) => i);
		const shuffled = shuffleArray(indices);
		shuffledAnswers[idx] = shuffled.map((i) => answers[i]);
		shuffledIndices[idx] = shuffled;
	});

	function handleToggleFavorite(idx: number) {
		if (!pageState.quizData[idx]) return;
		const qid = pageState.quizData[idx].question_id;
		if (favorites.has(qid)) {
			favorites.delete(qid);
			// If in favorites view, remove the question from quizData and update current index
			if (appState.currentView === 'favorites') {
				pageState.quizData = pageState.quizData.filter((q) => favorites.has(q.question_id));
				// Clamp current index to valid range
				pageState.current = Math.max(0, Math.min(pageState.current, pageState.quizData.length - 1));
			}
		} else {
			favorites.add(qid);
		}
	}

	function handleAnswerClick(idx: number, questionType: string) {
		if (DEBUG) {
			console.log('[handleAnswerClick] called', {
				idx,
				questionType,
				questionLocked: pageState.questionLocked,
				currentQuestionId: pageState.quizData[pageState.current]?.question_id,
				lockedStatus: pageState.questionLockedStatus.get(
					pageState.quizData[pageState.current]?.question_id
				)
			});
		}
		if (pageState.questionLocked) {
			if (DEBUG) console.log('[handleAnswerClick] blocked: pageState.questionLocked');
			return;
		}
		const currentQuestionId = pageState.quizData[pageState.current]?.question_id;
		if (!currentQuestionId) {
			if (DEBUG) console.log('[handleAnswerClick] blocked: no currentQuestionId');
			return;
		}

		// For single-answer questions, return early if the question is already locked
		if (questionType === 'single' && pageState.questionLockedStatus.get(currentQuestionId)) {
			if (DEBUG) console.log('[handleAnswerClick] blocked: already locked for single');
			return;
		}

		const currentAnswers = pageState.questionAnswers.get(currentQuestionId) || [];
		let newAnswers: number[];
		if (questionType === 'multiple_answer_question') {
			if (currentAnswers.includes(idx)) {
				newAnswers = currentAnswers.filter((i) => i !== idx);
			} else {
				newAnswers = [...currentAnswers, idx];
			}
		} else {
			newAnswers = [idx];
			if (DEBUG) console.log('[handleAnswerClick] single-answer: locking after selection');
			checkAnswers();
		}
		pageState.questionAnswers.set(currentQuestionId, newAnswers);
		if (DEBUG) console.log('[handleAnswerClick] updated answers', newAnswers);
	}

	function checkAnswers() {
		const currentQuestionId = pageState.quizData[pageState.current]?.question_id;
		if (currentQuestionId) {
			pageState.questionLockedStatus.set(currentQuestionId, true);
		}
	}

	function goToPreviousCard() {
		if (pageState.current > 0) {
			// Reset all question states when navigating to a new card
			pageState.questionAnswers.clear();
			pageState.questionLockedStatus.clear();
			pageState.current -= 1;
		}
	}

	function goToNextCard() {
		if (pageState.current < pageState.quizData.length - 1) {
			// Reset all question states when navigating to a new card
			pageState.questionAnswers.clear();
			pageState.questionLockedStatus.clear();
			pageState.current += 1;
		}
	}

	const currentReadingPassage = $derived(
		isReadingQuestion(pageState.current)
			? (pageState.quizData[pageState.current]?.reading_passage as string | undefined) || ''
			: ''
	);

	const currentReadingTitle = $derived(
		isReadingQuestion(pageState.current)
			? (pageState.quizData[pageState.current]?.reading_title as string | undefined) || ''
			: ''
	);
</script>

<!-- Carousel Component -->
{#if pageState.quizData.length > 0}
	{#if isReadingQuestion(pageState.current)}
		<div class="w-full h-full grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[minmax(0,1.2fr)_minmax(0,1fr)] gap-0">
			<div class="border-b border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
				<div class="h-full overflow-y-auto main-scrollbar p-4 md:p-6">
					{#if currentReadingTitle}
						<h3 class="text-[var(--color-primary)] font-semibold mb-3">{currentReadingTitle}</h3>
					{/if}
					<div class="whitespace-pre-wrap text-sm md:text-base leading-relaxed text-[var(--text-primary)]">
						{currentReadingPassage}
					</div>
				</div>
			</div>

			<div class="min-h-0 bg-[var(--bg-primary)]">
				<ReadingQuestionPanel
					currentQuestion={getCurrentQuestionWithType(pageState.quizData[pageState.current])}
					current={pageState.current}
					quizData={pageState.quizData}
					selectedAnswers={pageState.questionAnswers.get(pageState.quizData[pageState.current]?.question_id) ?? []}
					questionLocked={pageState.questionLockedStatus.get(
						pageState.quizData[pageState.current]?.question_id
					) ?? false}
					{checkAnswers}
					{handleAnswerClick}
					{favorites}
					toggleFavorite={(idx: number) => handleToggleFavorite(idx)}
					answers={getAnswers(pageState.current)}
					originalIndices={shuffledIndices[pageState.current]}
					{goToPreviousCard}
					{goToNextCard}
				/>
			</div>
		</div>
	{:else}
		<div class="carousel-vertical flex flex-col w-full h-full relative overflow-hidden">
			{#each [pageState.current - 1, pageState.current, pageState.current + 1] as idx (idx)}
				{#if idx >= 0 && idx < pageState.quizData.length}
					<div
						class="carousel-card absolute inset-0"
						style="transform: translateY({(idx - pageState.current) *
							100}%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);"
					>
						<QuizCard
							currentQuestion={getCurrentQuestionWithType(pageState.quizData[idx])}
							current={idx}
							quizData={pageState.quizData}
							selectedAnswers={pageState.questionAnswers.get(pageState.quizData[idx]?.question_id) ??
								[]}
							questionLocked={pageState.questionLockedStatus.get(
								pageState.quizData[idx]?.question_id
							) ?? false}
							{checkAnswers}
							{handleAnswerClick}
							{favorites}
							toggleFavorite={(idx: number) => handleToggleFavorite(idx)}
							answers={getAnswers(idx)}
							originalIndices={shuffledIndices[idx]}
							{goToPreviousCard}
							{goToNextCard}
						/>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
{:else}
	<div class="w-full h-full flex flex-col items-center justify-center">
		<div class="text-lg text-[var(--text-primary)] font-medium tracking-wide">
			No favorite questions
		</div>
	</div>
{/if}
