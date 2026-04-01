<script lang="ts">
	import { X } from '@lucide/svelte';
	
	let { saveName, dismiss } = $props<{ saveName: (n: string) => void, dismiss: () => void }>();

	let name = $state('');

	function onSubmit(e: Event) {
		e.preventDefault();
		saveName(name);
	}
</script>

<div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 p-4 transition-opacity">
	<div 
		class="bg-[var(--bg-surface)] rounded-2xl p-6 w-full shadow-2xl border border-[var(--border)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
		style="max-width: 360px;"
	>
		<button class="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer" onclick={dismiss} aria-label="Đóng">
			<X size={20} />
		</button>
		
		<div class="mb-5 mt-1 text-center">
			<h2 class="text-xl font-bold text-[var(--color-primary)] mb-1">Chào bạn! 👋</h2>
			<p class="text-[var(--text-primary)] text-sm">Mình có thể biết tên bạn được không?</p>
		</div>

		<form onsubmit={onSubmit} class="flex flex-col gap-3">
			<input 
				type="text" 
				bind:value={name} 
				placeholder="Nhập tên..." 
				class="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-sm outline-none focus:border-[var(--color-primary)] transition-all text-center"
				required
				autocomplete="off"
			/>
			<button type="submit" class="w-full bg-[var(--color-primary)] hover:opacity-90 text-[var(--bg-primary)] font-bold py-2.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50 text-sm mt-1" disabled={!name.trim()}>
				Lưu tên
			</button>
		</form>
	</div>
</div>
