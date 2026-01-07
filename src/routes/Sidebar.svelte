<script lang="ts">
	import { Star, ChevronLeft } from '@lucide/svelte';
	import { pageState, favorites, uiState, loadQuiz } from './global.svelte';

	$effect(() => {
		if (uiState.sidebarMode === 'questions') {
			const btns = document.querySelectorAll('.sidebar-btn');
			const btn = btns[pageState.current] as HTMLElement | undefined;
			if (btn) {
				btn.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
			}
		}
	});

	function handleQuestionClick(idx: number) {
		pageState.current = idx;
		if (typeof window !== 'undefined' && window.innerWidth < 768) {
			uiState.sidebarOpen = false;
		}
	}

	function handleBackToLibrary() {
		uiState.sidebarMode = 'library';
	}
</script>

<div
	class="sidebar flex flex-col h-screen bg-[var(--bg-surface)] w-full border-r border-[var(--border)]"
>
	{#if uiState.sidebarMode === 'library'}
		<!-- Library Mode -->
		<div class="p-4 flex flex-col gap-6 overflow-y-auto">
			<h2 class="text-[var(--color-primary)] text-xl font-bold px-2">Quiz Library</h2>
			{#each uiState.navigation as subject (subject.id)}
				<div class="flex flex-col gap-2">
					<h3
						class="text-[var(--text-secondary)] text-sm font-semibold uppercase tracking-wider px-2"
					>
						{subject.name}
					</h3>
					<div class="flex flex-col gap-1">
						{#each subject.quizzes as quiz (quiz.id)}
							<button
								class="cursor-pointer text-left px-4 py-2 rounded-lg text-sm transition-colors {pageState.moduleId ===
								quiz.id
									? 'bg-[var(--bg-hover)] text-[var(--color-primary)] font-bold border border-[var(--color-primary)]'
									: 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}"
								onclick={() => loadQuiz(quiz.id)}
							>
								{quiz.name}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Question Mode -->
		<div class="flex flex-col h-full">
			<button
				class="flex items-center gap-2 p-4 text-[var(--color-primary)] hover:bg-[var(--bg-hover)] transition-colors font-semibold"
				onclick={handleBackToLibrary}
			>
				<ChevronLeft size={20} />
				Back to Library
			</button>

			<div class="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
				{#each pageState.quizData as q, idx (q.question_id)}
					<button
						class="cursor-pointer sidebar-btn flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-colors {idx ===
						pageState.current
							? 'bg-[var(--color-primary)] text-[var(--bg-primary)] font-bold'
							: 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}"
						onclick={() => handleQuestionClick(idx)}
					>
						<span>Question {idx + 1}</span>
						{#if favorites.has(q.question_id)}
							<Star fill="var(--color-accent)" color="var(--color-accent)" size={16} />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
