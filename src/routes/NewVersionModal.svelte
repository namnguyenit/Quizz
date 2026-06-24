<!-- This is the new version notification modal component -->
<script lang="ts">
	import { APP_VERSION } from '../lib/config';
	const show = $state(true);
	const { onReload } = $props<{ onReload: () => void }>();

	let oldVersion = $state<string | null>(null);
	const stage = $state({ value: 'info' as 'info' | 'changelog' });

	import { APP_VERSION_KEY } from '../lib/localKeys';

	$effect(() => {
		oldVersion = localStorage.getItem(APP_VERSION_KEY);
	});

	function handleReload() {
		onReload();
	}

	function handleChangelogs() {
		stage.value = 'changelog';
	}
</script>

{#if show}
	<div
		class="modal-backdrop-responsive"
		style="z-index: 2000;"
	>
		<div
			class="modal-sheet-responsive text-[var(--text-primary)] flex flex-col gap-5"
		>
			<!-- Drag handle for mobile bottom sheet -->
			<div class="modal-drag-handle"></div>

			<div class="text-2xl font-bold text-[var(--text-primary)] text-center">New Version Available</div>
			<div class="text-center text-base text-[var(--text-primary)]">
				<span class="flex items-center justify-center gap-2">
					<span class="text-[var(--color-error)] font-semibold">{oldVersion ?? 'Unknown'}</span>
					<span class="text-[var(--text-secondary)] text-lg">→</span>
					<span class="text-[var(--color-success)] font-semibold">{APP_VERSION}</span>
				</span>
			</div>
			{#if stage.value === 'info'}
				<div class="text-[var(--text-secondary)] text-center text-sm">
					The app has been updated. Local data will be cleared after reload.<br />
					To copy your favorite IDs, click the star icon at the bottom right to open the favorites modal.
				</div>
				<div class="flex flex-col gap-3">
					<button
						type="button"
						class="cursor-pointer w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity duration-200"
						onclick={handleChangelogs}
					>
						Changelogs
					</button>
				</div>
			{:else}
				<div class="text-[var(--text-secondary)] text-left bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
					<div class="font-bold text-[var(--text-primary)] mb-2">Thay đổi mới nhất</div>
					<ul class="list-disc list-inside space-y-1.5 text-sm">
						<li>Giao diện câu hỏi toàn màn hình (bỏ kiểu thẻ)</li>
						<li>Chuyển cài đặt Giao diện và Font vào modal Cài đặt</li>
						<li>Hiển thị song ngữ xếp chồng (Tiếng Anh trên, Tiếng Việt dưới)</li>
					</ul>
				</div>
				<div class="flex flex-col gap-3">
					<button
						type="button"
						class="cursor-pointer w-full py-2.5 px-4 rounded-xl bg-[var(--color-success)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity duration-200"
						onclick={handleReload}
					>
						Reload
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
