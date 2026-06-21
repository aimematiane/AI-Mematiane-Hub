<script>
	import { User } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';

	let { src = '', alt = '', size = 'md', iconClass = 'text-surface-400', class: className = '' } = $props();

	let failed = $state(false);

	const sizes = {
		xs: {
			wrapper: 'w-6 h-6',
			icon: 10
		},
		sm: {
			wrapper: 'w-8 h-8',
			icon: 14
		},
		md: {
			wrapper: 'w-9 h-9',
			icon: 16
		},
		lg: {
			wrapper: 'w-10 h-10',
			icon: 16
		},
		xl: {
			wrapper: 'w-16 h-16',
			icon: 28
		}
	};

	const currentSize = $derived(sizes[size] || sizes.md);
	const displaySrc = $derived(src && !failed ? optimizeImageUrl(src, { width: 120, quality: 80 }) : '');

	$effect(() => {
		src;
		failed = false;
	});
</script>

{#if displaySrc}
	<img
		src={displaySrc}
		{alt}
		class="{currentSize.wrapper} rounded-full object-cover bg-surface-800 {className}"
		onerror={() => { failed = true; }}
	/>
{:else}
	<div class="{currentSize.wrapper} rounded-full bg-surface-700 flex items-center justify-center shrink-0 {className}">
		<User size={currentSize.icon} class={iconClass} />
	</div>
{/if}
