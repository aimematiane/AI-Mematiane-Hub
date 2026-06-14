<script>
	import { Share2, Send } from '@lucide/svelte';

	let { title, url = '', description = '' } = $props();

	const siteUrl = import.meta.env.VITE_SITE_URL || '';

	let supportsWebShare = $state(false);

	$effect(() => {
		supportsWebShare = typeof navigator !== 'undefined' && !!navigator.share;
	});

	async function handleWebShare() {
		try {
			await navigator.share({ title, url: getShareUrl(), text: description });
		} catch (e) {
			// User cancelled or share failed
		}
	}

	function getShareUrl() {
		return url.startsWith('http') ? url : `${siteUrl}${url}`;
	}

	function getFallbackLinks() {
		const shareUrl = getShareUrl();
		const encodedTitle = encodeURIComponent(title);
		const encodedUrl = encodeURIComponent(shareUrl);
		return [
			{ name: 'X (Twitter)', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, color: 'hover:bg-sky-500/20 hover:text-sky-400' },
			{ name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: 'hover:bg-blue-500/20 hover:text-blue-400' },
			{ name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, color: 'hover:bg-blue-600/20 hover:text-blue-500' },
			{ name: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, color: 'hover:bg-sky-400/20 hover:text-sky-300', icon: Send }
		];
	}
</script>

<div class="flex items-center gap-2 flex-wrap">
	{#if supportsWebShare}
		<button
			onclick={handleWebShare}
			class="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-all text-sm"
		>
			<Share2 size={16} />
			Share
		</button>
	{:else}
		{#each getFallbackLinks() as link}
			<a
				href={link.href}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-800 text-surface-400 transition-all text-sm {link.color}"
				aria-label={`Share on ${link.name}`}
			>
				{#if link.icon}
					<link.icon size={14} />
				{:else}
					<Share2 size={14} />
				{/if}
				<span class="hidden sm:inline">{link.name}</span>
			</a>
		{/each}
	{/if}
</div>
