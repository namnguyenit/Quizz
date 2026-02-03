<script lang="ts">
	import { BookOpen, ChevronRight } from '@lucide/svelte';
	import { uiState, loadQuiz } from './global.svelte';

	function handleQuizClick(quizId: string) {
		loadQuiz(quizId);
	}
</script>

<div class="library-grid w-full h-full overflow-y-auto p-4 md:p-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Quiz Library</h1>
			<p class="text-[var(--text-secondary)] text-sm md:text-base">Select a quiz to get started</p>
		</div>

		<!-- Subjects -->
		{#if uiState.navigation.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<BookOpen size={48} class="text-[var(--text-secondary)] mb-4 opacity-50" />
				<p class="text-[var(--text-secondary)]">Loading quizzes...</p>
			</div>
		{:else}
			<div class="flex flex-col gap-8">
				{#each uiState.navigation as subject (subject.id)}
					<section>
						<!-- Subject Header -->
						<div class="flex items-center gap-2 mb-4">
							<h2 class="text-lg md:text-xl font-semibold text-[var(--color-primary)]">
								{subject.name}
							</h2>
							{#if subject.description}
								<span class="text-xs text-[var(--text-secondary)] hidden md:inline">
									— {subject.description}
								</span>
							{/if}
						</div>

						<!-- Quiz Cards Grid -->
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{#each subject.quizzes as quiz (quiz.id)}
								<button
									class="group cursor-pointer text-left p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
									onclick={() => handleQuizClick(quiz.id)}
								>
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 min-w-0">
											<h3
												class="font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors truncate"
											>
												{quiz.name}
											</h3>
										</div>
										<ChevronRight
											size={18}
											class="flex-shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all"
										/>
									</div>
								</button>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		{/if}

		<!-- Copyright Footer -->
		<div class="mt-12 pt-8 border-t border-[var(--border)] text-center">
			<p class="text-[var(--text-secondary)] text-sm">
				Design By <span class="font-semibold text-[var(--color-primary)]">TrungCao</span>
			</p>
		</div>
	</div>
</div>
