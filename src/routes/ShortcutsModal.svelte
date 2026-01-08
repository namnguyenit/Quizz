<script lang="ts">
	import { uiState } from './global.svelte';
	import { CircleHelp } from '@lucide/svelte';

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			uiState.showShortcutsModal = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			uiState.showShortcutsModal = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if uiState.showShortcutsModal}
	<div
		class="fixed inset-0 z-[1001] bg-black/50 backdrop-opacity-60 flex items-center justify-center"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		aria-labelledby="shortcuts-title"
	>
		<div
			class="bg-[var(--bg-surface)] p-6 rounded-xl min-w-[320px] max-w-[95vw] shadow-xl border border-[var(--border)] text-[var(--text-primary)]"
		>
			<div class="flex items-center gap-2 mb-4">
				<CircleHelp size={22} class="text-[var(--color-primary)]" />
				<h3 id="shortcuts-title" class="text-[var(--color-primary)] text-lg font-semibold">
					Keyboard Shortcuts
				</h3>
			</div>

			<table class="w-full text-left">
				<tbody>
					<tr class="border-b border-[var(--border)]">
						<td class="py-2 text-[var(--text-secondary)]">Next question</td>
						<td class="py-2 text-right">
							<kbd>→</kbd>
							<kbd>D</kbd>
							<kbd>Scroll ↓</kbd>
						</td>
					</tr>
					<tr>
						<td class="py-2 text-[var(--text-secondary)]">Previous question</td>
						<td class="py-2 text-right">
							<kbd>←</kbd>
							<kbd>A</kbd>
							<kbd>Scroll ↑</kbd>
						</td>
					</tr>
				</tbody>
			</table>

			<button
				class="mt-4 w-full text-base py-2 rounded-lg bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium hover:bg-[var(--border)] cursor-pointer border border-[var(--border)]"
				onclick={() => (uiState.showShortcutsModal = false)}
			>
				Close
			</button>
		</div>
	</div>
{/if}

<style>
	kbd {
		display: inline-block;
		padding: 0.15rem 0.4rem;
		font-size: 0.85em;
		font-family: monospace;
		background: var(--bg-hover);
		border: 1px solid var(--border);
		border-radius: 4px;
		margin-left: 0.25rem;
	}
</style>
