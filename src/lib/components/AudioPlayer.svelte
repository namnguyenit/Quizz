<script lang="ts">
	import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Gauge } from '@lucide/svelte';

	interface Props {
		src: string;
		title?: string | null;
	}

	let { src, title = 'Listening Audio' }: Props = $props();

	let audioElement = $state<HTMLAudioElement | null>(null);
	let isPaused = $state(true);
	let currentTime = $state(0);
	let duration = $state(0);
	let playbackRate = $state(1.0);
	let volume = $state(1.0);
	let isMuted = $state(false);
	let showSpeedMenu = $state(false);

	const speeds = [0.8, 1.0, 1.2, 1.5];

	// Keep playback rate applied to the audio element when it changes or when the source changes
	$effect(() => {
		if (audioElement && src) {
			audioElement.playbackRate = playbackRate;
		}
	});

	function togglePlay() {
		isPaused = !isPaused;
	}

	function skip(seconds: number) {
		if (audioElement) {
			let newTime = currentTime + seconds;
			if (newTime < 0) newTime = 0;
			if (newTime > duration) newTime = duration;
			currentTime = newTime;
		}
	}

	function selectSpeed(speed: number) {
		playbackRate = speed;
		showSpeedMenu = false;
	}

	function cycleSpeed() {
		const currentIndex = speeds.indexOf(playbackRate);
		const nextIndex = (currentIndex + 1) % speeds.length;
		playbackRate = speeds[nextIndex];
	}

	function toggleMute() {
		isMuted = !isMuted;
	}

	function formatTime(seconds: number): string {
		if (isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
	}

	function handleTimelineChange(e: Event) {
		const target = e.target as HTMLInputElement;
		currentTime = parseFloat(target.value);
	}

	function handleVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		volume = parseFloat(target.value);
		if (volume > 0) {
			isMuted = false;
		}
	}
</script>

<div class="audio-player flex flex-col gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]/85 backdrop-blur-lg shadow-lg max-w-xl mx-auto w-full select-none">
	<audio
		bind:this={audioElement}
		{src}
		bind:currentTime
		bind:duration
		bind:paused={isPaused}
		bind:volume
		bind:muted={isMuted}
	></audio>

	<!-- Header/Title -->
	<div class="flex items-center justify-between min-w-0 border-b border-[var(--border)] pb-2.5">
		<div class="flex flex-col min-w-0">
			<span class="text-xs text-[var(--color-primary)] font-bold tracking-wider uppercase">Listening Passage</span>
			<span class="text-sm font-semibold text-[var(--text-primary)] truncate mt-0.5">{title || 'Audio track'}</span>
		</div>
		<div class="flex items-center gap-1.5 shrink-0 bg-[var(--bg-primary)] px-2 py-1 rounded-lg border border-[var(--border)]">
			<span class="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></span>
			<span class="text-[10px] text-[var(--text-secondary)] font-mono font-bold tracking-wide">AUDIO READY</span>
		</div>
	</div>

	<!-- Timeline Slider -->
	<div class="flex flex-col gap-1 w-full">
		<div class="relative w-full flex items-center group">
			<input
				type="range"
				min="0"
				max={duration || 100}
				value={currentTime}
				oninput={handleTimelineChange}
				class="timeline-slider w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer outline-none transition-all focus:h-2"
				style="background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) {((currentTime / (duration || 1)) * 100).toFixed(2)}%, var(--border) {((currentTime / (duration || 1)) * 100).toFixed(2)}%, var(--border) 100%)"
			/>
		</div>
		<div class="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-medium">
			<span>{formatTime(currentTime)}</span>
			<span>{formatTime(duration)}</span>
		</div>
	</div>

	<!-- Media Controls -->
	<div class="flex items-center justify-between gap-4">
		<!-- Speed Control -->
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={cycleSpeed}
				class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-xs text-[var(--text-primary)] hover:border-[var(--color-primary)] transition-all font-semibold active:scale-95 cursor-pointer"
				title="Cycle playback speed"
			>
				<Gauge size={14} class="text-[var(--color-primary)]" />
				<span>{playbackRate.toFixed(1)}x</span>
			</button>
		</div>

		<!-- Playback Controls -->
		<div class="flex items-center gap-4">
			<button
				type="button"
				onclick={() => skip(-10)}
				class="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-primary)] active:scale-90 transition-all cursor-pointer"
				title="Rewind 10 seconds"
			>
				<RotateCcw size={20} />
			</button>

			<button
				type="button"
				onclick={togglePlay}
				class="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--bg-primary)] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
				title={isPaused ? 'Play' : 'Pause'}
			>
				{#if isPaused}
					<Play size={22} fill="currentColor" class="ml-0.5" />
				{:else}
					<Pause size={22} fill="currentColor" />
				{/if}
			</button>

			<button
				type="button"
				onclick={() => skip(10)}
				class="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-primary)] active:scale-90 transition-all cursor-pointer"
				title="Forward 10 seconds"
			>
				<RotateCw size={20} />
			</button>
		</div>

		<!-- Volume Controls -->
		<div class="flex items-center gap-2 group/volume w-[100px] justify-end">
			<button
				type="button"
				onclick={toggleMute}
				class="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-primary)] active:scale-90 transition-all cursor-pointer"
				title={isMuted ? 'Unmute' : 'Mute'}
			>
				{#if isMuted || volume === 0}
					<VolumeX size={18} />
				{:else}
					<Volume2 size={18} />
				{/if}
			</button>
			<input
				type="range"
				min="0"
				max="1"
				step="0.05"
				value={isMuted ? 0 : volume}
				oninput={handleVolumeChange}
				class="volume-slider w-16 h-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer outline-none accent-[var(--color-primary)]"
			/>
		</div>
	</div>
</div>

<style>
	/* Timeline slider custom styling */
	.timeline-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
		transition: transform 0.1s ease;
	}

	.timeline-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.timeline-slider::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
		border: none;
		transition: transform 0.1s ease;
	}

	.timeline-slider::-moz-range-thumb:hover {
		transform: scale(1.2);
	}

	/* Volume slider custom styling */
	.volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
	}

	.volume-slider::-moz-range-thumb {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
		border: none;
	}
</style>
