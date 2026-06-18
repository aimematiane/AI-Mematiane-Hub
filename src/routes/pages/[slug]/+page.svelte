<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Calendar, ChevronDown } from '@lucide/svelte';

	let { data } = $props();
	let page = $derived(data.page);
	let sections = $derived(page.sections || []);
	let openFaq = $state({});

	function toggleFaq(id) {
		openFaq = { ...openFaq, [id]: !openFaq[id] };
	}
</script>

<SeoHead
	title={page.meta_title || page.title}
	description={page.meta_description}
/>

<div class="min-h-screen">
	{#each sections as section (section.id)}

		<!-- HERO -->
		{#if section.type === 'hero'}
			<section class="py-16 md:py-24 px-4">
				<div class="max-w-4xl mx-auto text-{section.data.alignment || 'center'}">
					<h1 class="font-bold text-white leading-tight mb-4
						{section.data.size === 'small' ? 'text-2xl md:text-3xl' : section.data.size === 'medium' ? 'text-3xl md:text-4xl' : 'text-4xl md:text-6xl'}">
						{section.data.title}
					</h1>
					{#if section.data.subtitle}
						<p class="text-surface-400 max-w-2xl leading-relaxed
							{section.data.alignment === 'center' ? 'mx-auto' : ''}
							{section.data.size === 'small' ? 'text-base' : section.data.size === 'medium' ? 'text-lg' : 'text-xl'}">
							{section.data.subtitle}
						</p>
					{/if}
					<div class="mt-8 h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent max-w-md {section.data.alignment === 'center' ? 'mx-auto' : ''}"></div>
				</div>
			</section>

		<!-- RICH TEXT -->
		{:else if section.type === 'rich_text'}
			<section class="py-10 px-4">
				<div class="max-w-4xl mx-auto prose prose-invert prose-lg
					prose-headings:text-white prose-headings:font-bold
					prose-p:text-surface-300 prose-p:leading-relaxed
					prose-a:text-accent-400 prose-a:no-underline hover:prose-a:underline
					prose-strong:text-white
					prose-code:text-accent-300 prose-code:bg-surface-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
					prose-blockquote:border-accent-500 prose-blockquote:text-surface-400
					prose-ul:text-surface-300 prose-ol:text-surface-300
					prose-hr:border-surface-700
					prose-img:rounded-xl">
					{@html section.data.content}
				</div>
			</section>

		<!-- CARDS -->
		{:else if section.type === 'cards'}
			<section class="py-12 px-4">
				<div class="max-w-6xl mx-auto grid gap-5
					{section.data.columns == 2 ? 'grid-cols-1 md:grid-cols-2' : section.data.columns == 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}">
					{#each section.data.cards as card (card.id)}
						<div class="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1
							{section.data.style === 'gradient'
								? 'bg-gradient-to-br from-surface-800 to-surface-900 border border-surface-700/50 hover:border-accent-500/30 shadow-lg hover:shadow-accent-500/5'
								: section.data.style === 'bordered'
									? 'bg-surface-900 border-2 border-surface-700 hover:border-accent-500/40'
									: 'bg-surface-900/80 border border-surface-800 hover:border-surface-700 hover:bg-surface-800/80'}">
							{#if card.icon}
								<div class="text-3xl mb-4">{card.icon}</div>
							{/if}
							<h3 class="text-lg font-semibold text-white mb-2 group-hover:text-accent-400 transition-colors">{card.title}</h3>
							<p class="text-sm text-surface-400 leading-relaxed">{card.description}</p>
						</div>
					{/each}
				</div>
			</section>

		<!-- FAQ -->
		{:else if section.type === 'faq'}
			<section class="py-12 px-4">
				<div class="max-w-3xl mx-auto">
					{#if section.data.title}
						<h2 class="text-2xl md:text-3xl font-bold text-white text-center mb-10">{section.data.title}</h2>
					{/if}
					<div class="space-y-3">
						{#each section.data.items as item (item.id)}
							<div class="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden transition-colors
								{openFaq[item.id] ? 'border-accent-500/30' : 'hover:border-surface-700'}">
								<button
									onclick={() => toggleFaq(item.id)}
									class="w-full flex items-center justify-between px-5 py-4 text-left"
								>
									<span class="text-sm font-medium text-white pr-4">{item.question}</span>
									<ChevronDown size={18}
										class="text-surface-400 transition-transform flex-shrink-0
											{openFaq[item.id] ? 'rotate-180 text-accent-400' : ''}" />
								</button>
								{#if openFaq[item.id]}
									<div class="px-5 pb-4 text-sm text-surface-400 leading-relaxed border-t border-surface-800 pt-3">
										{item.answer}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</section>

		<!-- CTA -->
		{:else if section.type === 'cta'}
			<section class="py-12 px-4">
				<div class="max-w-4xl mx-auto rounded-2xl p-10 md:p-14 text-center
					{section.data.style === 'gradient'
						? 'bg-gradient-to-br from-accent-600/20 via-surface-900 to-cyan-600/20 border border-accent-500/20'
						: section.data.style === 'outlined'
							? 'border-2 border-surface-700'
							: 'bg-surface-800'}">
					<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">{section.data.title}</h2>
					{#if section.data.description}
						<p class="text-surface-400 max-w-xl mx-auto mb-8 leading-relaxed">{section.data.description}</p>
					{/if}
					{#if section.data.buttonText}
						<a href={section.data.buttonUrl || '/'}
							class="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent-500 to-cyan-500 hover:from-accent-600 hover:to-cyan-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
							{section.data.buttonText}
						</a>
					{/if}
				</div>
			</section>

		<!-- DIVIDER -->
		{:else if section.type === 'divider'}
			<div class="max-w-4xl mx-auto px-4
				{section.data.spacing === 'small' ? 'py-4' : section.data.spacing === 'large' ? 'py-16' : 'py-8'}">
				{#if section.data.style === 'line'}
					<hr class="border-surface-800" />
				{:else if section.data.style === 'dots'}
					<div class="flex items-center justify-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-surface-600"></span>
						<span class="w-1.5 h-1.5 rounded-full bg-surface-600"></span>
						<span class="w-1.5 h-1.5 rounded-full bg-surface-600"></span>
					</div>
				{:else if section.data.style === 'gradient'}
					<div class="h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent"></div>
				{/if}
				<!-- 'space' style renders nothing, just spacing -->
			</div>
		{/if}

	{/each}

	<!-- Fallback: if no sections but has legacy content -->
	{#if sections.length === 0 && page.content}
		<article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<header class="mb-10">
				<h1 class="text-4xl font-bold text-white mb-4 leading-tight">{page.title}</h1>
				{#if page.published_at}
					<div class="flex items-center gap-2 text-surface-500 text-sm">
						<Calendar size={14} />
						<time datetime={page.published_at}>
							{new Date(page.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
						</time>
					</div>
				{/if}
			</header>
			<div class="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-surface-300 prose-a:text-accent-400">
				{@html page.content}
			</div>
		</article>
	{/if}

	<!-- Empty state -->
	{#if sections.length === 0 && !page.content}
		<div class="max-w-4xl mx-auto px-4 py-24 text-center">
			<h1 class="text-4xl font-bold text-white mb-4">{page.title}</h1>
			<p class="text-surface-500 italic">This page has no content yet.</p>
		</div>
	{/if}
</div>
