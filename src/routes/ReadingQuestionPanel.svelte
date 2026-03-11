<script lang="ts">
	import BilingualText from '$lib/components/BilingualText.svelte';
	import { Check, Circle, CircleDot, Square, SquareCheck, Star, X } from '@lucide/svelte';

	interface Answer {
		answer_text?: string;
		[key: string]: unknown;
	}

	interface CurrentQuestion {
		question_id?: string;
		question_text?: string;
		question_type?: string;
		answers?: Array<{ is_correct: boolean }>;
		reading_type?: string | null;
	}

	interface QuizQuestion {
		question_id?: string;
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

	function isMultipleChoice(): boolean {
		return currentQuestion?.question_type === 'multiple_answer_question';
	}

	function isFavorited(id: string) {
		return favorites.has(id);
	}

	function getAnswerClass(idx: number): string {
		const isSelected = selectedAnswers.includes(idx);
		const originalIdx = originalIndices?.[idx] ?? idx;
		const isCorrect = currentQuestion?.answers?.[originalIdx]?.is_correct;

		let classes = '';
		if (questionLocked) {
			if (isCorrect && isSelected) classes += ' border-[var(--color-success)] bg-[var(--color-success)]/10';
			else if (isCorrect && !isSelected)
				classes += ' border-[var(--color-accent)] border-dashed bg-[var(--color-accent)]/5';
			else if (!isCorrect && isSelected)
				classes += ' border-[var(--color-error)] bg-[var(--color-error)]/10';
		} else if (isSelected) {
			classes += ' border-[var(--color-primary)] bg-[var(--color-primary)]/10';
		}

		return classes;
	}

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

<div class="h-full flex flex-col overflow-hidden">
	<div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
		<div class="flex items-center gap-2 min-w-0">
			<span class="text-sm text-[var(--text-secondary)]">Question {current + 1} / {quizData.length}</span>
			{#if currentQuestion?.reading_type}
				<span
					class="text-xs px-2 py-0.5 rounded border border-[var(--color-secondary)] text-[var(--color-secondary)]"
				>
					{currentQuestion.reading_type}
				</span>
			{/if}
		</div>
		<button
			type="button"
			aria-label="Toggle favorite"
			class="w-9 h-9 bg-transparent border-none p-0 flex items-center justify-center"
			onclick={() => toggleFavorite(current)}
		>
			{#if isFavorited(currentQuestion?.question_id ?? '')}
				<Star fill="var(--color-accent)" color="var(--color-accent)" size={24} />
			{:else}
				<Star color="var(--text-primary)" size={24} />
			{/if}
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-4 md:p-6 main-scrollbar">
		<div class="mb-4 text-base md:text-lg text-[var(--text-primary)]">
			<BilingualText text={currentQuestion?.question_text || ''} variant="question" />
		</div>

		<div class="flex flex-col gap-3 mb-4">
			{#each answers as ans, idx (idx)}
				{@const resultIcon = getAnswerResultIcon(idx)}
				{@const isSelected = selectedAnswers.includes(idx)}
				<button
					type="button"
					class="answer relative flex items-start gap-3 px-4 py-3 rounded-lg border-2 border-[var(--border)] bg-[var(--bg-hover)] text-base text-[var(--text-primary)] cursor-pointer transition-all duration-200 text-left break-words {getAnswerClass(idx)}"
					disabled={questionLocked}
					onclick={() => handleAnswerClick(idx, currentQuestion.question_type ?? 'single_answer_question')}
					aria-pressed={isSelected}
				>
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

					<span class="flex-1">
						<BilingualText text={ans.answer_text || String(ans)} variant="answer" />
					</span>

					{#if resultIcon}
						<span class="flex-shrink-0 mt-0.5">
							{#if resultIcon === 'correct'}
								<Check size={20} class="text-[var(--color-success)]" />
							{:else if resultIcon === 'incorrect'}
								<X size={20} class="text-[var(--color-error)]" />
							{:else}
								<span class="text-[var(--color-accent)] text-xs font-medium">Missed</span>
							{/if}
						</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if isMultipleChoice() && !questionLocked}
			<div class="flex flex-col items-center gap-2 mb-2">
				<button
					class="px-6 py-2.5 rounded-lg font-semibold text-sm md:text-base transition-all duration-200
					{selectedAnswers.length > 0
						? 'bg-[var(--color-primary)] text-[var(--bg-primary)]'
						: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-not-allowed opacity-50'}"
					onclick={checkAnswers}
					disabled={selectedAnswers.length === 0}
				>
					Check Answers
				</button>
			</div>
		{/if}
	</div>

	<div class="flex items-center justify-between gap-3 p-3 border-t border-[var(--border)] bg-[var(--bg-surface)]">
		<button
			type="button"
			class="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-40"
			onclick={goToPreviousCard}
			disabled={current <= 0}
		>
			Previous
		</button>
		<button
			type="button"
			class="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--bg-primary)] disabled:opacity-40"
			onclick={goToNextCard}
			disabled={current >= quizData.length - 1}
		>
			Next
		</button>
	</div>
</div>
