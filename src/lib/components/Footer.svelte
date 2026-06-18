<script>
	import { SOCIAL_ICONS } from '$lib/utils/socialIcons.js';

	let { footer = {} } = $props();

	const settings = $derived(footer.settings || {});
	const columns = $derived(footer.columns || []);
	const socialLinks = $derived(footer.socialLinks || []);

	const siteName = $derived(settings.site_name || 'AI Mematiane');
	const description = $derived(settings.footer_description || 'Your global directory of AI models, tools, news, and deep-dive analysis. Stay ahead of the curve.');
	const copyright = $derived(settings.copyright_text || `© ${new Date().getFullYear()} AI Mematiane. All rights reserved.`);

	function sortedLinks(links) {
		return [...(links || [])].filter(l => l.is_visible !== false).sort((a, b) => a.sort_order - b.sort_order);
	}
</script>

<footer class="border-t border-surface-800 bg-surface-950">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
			<!-- Brand -->
			<div class="md:col-span-1">
				<a href="/" class="flex items-center gap-2 mb-4">
					{#if settings.logo_url}
						<img src={settings.logo_url} alt={siteName} class="w-10 h-10 rounded-md object-cover" />
					{:else}
						<img src="/logo.png" alt={siteName} class="w-10 h-10 rounded-md object-cover" />
					{/if}
					<span class="text-lg font-bold text-white">{siteName}</span>
				</a>
				<p class="text-sm text-surface-400 leading-relaxed">{description}</p>
			</div>

			<!-- Dynamic Columns from DB -->
			{#each columns as column}
				<div>
					<p class="text-sm font-semibold text-white mb-3 font-display">{column.title}</p>
					<ul class="space-y-2">
						{#each sortedLinks(column.links) as link}
							<li>
								<a
									href={link.url}
									target={link.is_external ? '_blank' : undefined}
									rel={link.is_external ? 'noopener noreferrer' : undefined}
									class="text-sm text-surface-400 hover:text-accent-400 transition-colors"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}

			<!-- Social Links (if any) -->
			{#if socialLinks.length > 0}
				<div>
					<p class="text-sm font-semibold text-white mb-3 font-display">Connect</p>
					<div class="flex items-center gap-3 flex-wrap">
						{#each socialLinks as social}
							{@const iconData = SOCIAL_ICONS[social.icon_key] || SOCIAL_ICONS.link}
							<a
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={social.label}
								class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all"
							>
								{@html iconData.svg}
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div class="border-t border-surface-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
			<p class="text-xs text-surface-500">{copyright}</p>
			{#if settings.privacy_policy_url || settings.terms_url}
				<div class="flex gap-4">
					{#if settings.privacy_policy_url}
						<a href={settings.privacy_policy_url} class="text-xs text-surface-500 hover:text-surface-400 transition-colors">Privacy Policy</a>
					{/if}
					{#if settings.terms_url}
						<a href={settings.terms_url} class="text-xs text-surface-500 hover:text-surface-400 transition-colors">Terms of Service</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</footer>
