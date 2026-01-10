<script lang="ts">
	import { parseQuestionText, parseAnswerText } from '$lib/bilingualText';
	import { enStyleState } from '../../routes/global.svelte';

	interface Props {
		text: string;
		variant?: 'question' | 'answer';
	}

	let { text, variant = 'question' }: Props = $props();

	const parsed = $derived(variant === 'question' ? parseQuestionText(text) : parseAnswerText(text));
</script>

{#if variant === 'question'}
	<!-- Question: English above, Vietnamese below -->
	<div class="flex flex-col gap-1">
		{#if parsed.english}
			<span style="font-size: {enStyleState.size}px; opacity: {enStyleState.opacity}">
				{parsed.english}
			</span>
		{/if}
		<span>{parsed.vietnamese}</span>
	</div>
{:else}
	<!-- Answer: Same line, English styled down -->
	{#if parsed.english}
		<span style="font-size: {enStyleState.size}px; opacity: {enStyleState.opacity}">
			{parsed.english}
		</span>
		<span class="mx-1" style="opacity: {enStyleState.opacity}">/</span>
		<span>{parsed.vietnamese}</span>
	{:else}
		<span>{parsed.vietnamese}</span>
	{/if}
{/if}
