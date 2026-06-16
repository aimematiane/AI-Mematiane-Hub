<script>
	import { User } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';

	let { src = '', name = '', size = 40 } = $props();

	// Render at 2x for crisp display on high-DPI screens
	const optimized = $derived(src ? optimizeImageUrl(src, { width: size * 2, quality: 85 }) : '');
	const iconSize = $derived(Math.round(size * 0.5));
</script>

{#if optimized}
	<img
		src={optimized}
		alt={name ? `${name}'s avatar` : 'User avatar'}
		width={size}
		height={size}
		style="width: {size}px; height: {size}px;"
		class="rounded-full object-cover ring-1 ring-white/10 bg-surface-800 shrink-0"
		loading="lazy"
	/>
{:else}
	<div
		style="width: {size}px; height: {size}px;"
		class="rounded-full bg-gradient-to-br from-surface-700 to-surface-800 ring-1 ring-white/10 flex items-center justify-center shrink-0"
		aria-hidden="true"
	>
		{#if name}
			<span class="font-semibold text-surface-300" style="font-size: {Math.round(size * 0.4)}px;">{name.charAt(0).toUpperCase()}</span>
		{:else}
			<User size={iconSize} class="text-surface-400" />
		{/if}
	</div>
{/if}
