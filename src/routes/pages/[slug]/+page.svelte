<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Calendar, Check, ChevronDown, Mail, MapPin, Phone } from '@lucide/svelte';
	import { resolveMetaTitle, resolveMetaDescription } from '$lib/config/site.js';

	let { data } = $props();
	let page = $derived(data.page);
	let sections = $derived(page.sections || []);
	let openFaq = $state({});

	function toggleFaq(id) {
		openFaq = { ...openFaq, [id]: !openFaq[id] };
	}
</script>

<SeoHead
	title={resolveMetaTitle(page.meta_title, page.title)}
	description={resolveMetaDescription(page.meta_description, page.title)}
	url={`/pages/${page.slug}`}
/>

<div class="min-h-screen">
	{#each sections as section (section.id)}
		{@const sectionData = section.data || {}}
		{@const sectionCards = sectionData.cards || []}
		{@const sectionItems = sectionData.items || []}
		{@const sectionImages = sectionData.images || []}

		<!-- HERO -->
		{#if section.type === 'hero'}
			<section class="py-16 md:py-24 px-4">
				<div class="max-w-4xl mx-auto text-{sectionData.alignment || 'center'}">
					<h1 class="font-bold text-white leading-tight mb-4
						{sectionData.size === 'small' ? 'text-2xl md:text-3xl' : sectionData.size === 'medium' ? 'text-3xl md:text-4xl' : 'text-4xl md:text-6xl'}">
						{sectionData.title}
					</h1>
					{#if sectionData.subtitle}
						<p class="text-surface-400 max-w-2xl leading-relaxed
							{sectionData.alignment === 'center' ? 'mx-auto' : ''}
							{sectionData.size === 'small' ? 'text-base' : sectionData.size === 'medium' ? 'text-lg' : 'text-xl'}">
							{sectionData.subtitle}
						</p>
					{/if}
					<div class="mt-8 h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent max-w-md {sectionData.alignment === 'center' ? 'mx-auto' : ''}"></div>
					{#if sectionData.primaryText || sectionData.secondaryText}
						<div class="mt-8 flex flex-wrap gap-3 {sectionData.alignment === 'center' ? 'justify-center' : sectionData.alignment === 'right' ? 'justify-end' : 'justify-start'}">
							{#if sectionData.primaryText}
								<a href={sectionData.primaryUrl || '/'} class="inline-flex items-center px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors">{sectionData.primaryText}</a>
							{/if}
							{#if sectionData.secondaryText}
								<a href={sectionData.secondaryUrl || '/'} class="inline-flex items-center px-6 py-3 rounded-xl border border-surface-700 hover:border-accent-500/50 text-surface-200 text-sm font-semibold transition-colors">{sectionData.secondaryText}</a>
							{/if}
						</div>
					{/if}
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
					{@html sectionData.content || ''}
				</div>
			</section>

		<!-- MEDIA + TEXT -->
		{:else if section.type === 'media_text'}
			<section class="py-12 px-4">
				<div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
					<div class="{sectionData.mediaPosition === 'right' ? 'lg:order-2' : ''}">
						{#if sectionData.imageUrl}
							<img src={sectionData.imageUrl} alt={sectionData.imageAlt || sectionData.title || ''} class="w-full rounded-2xl border border-surface-800 object-cover aspect-video" loading="lazy" />
						{:else}
							<div class="aspect-video rounded-2xl border border-dashed border-surface-700 bg-surface-900"></div>
						{/if}
					</div>
					<div>
						{#if sectionData.eyebrow}
							<p class="text-xs font-semibold uppercase tracking-wider text-accent-400 mb-3">{sectionData.eyebrow}</p>
						{/if}
						<h2 class="text-2xl md:text-4xl font-bold text-white mb-4">{sectionData.title}</h2>
						<p class="text-surface-300 leading-relaxed whitespace-pre-line">{sectionData.text}</p>
						{#if sectionData.buttonText}
							<a href={sectionData.buttonUrl || '/'} class="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors">{sectionData.buttonText}</a>
						{/if}
					</div>
				</div>
			</section>

		<!-- CARDS -->
		{:else if section.type === 'cards'}
			<section class="py-12 px-4">
				<div class="max-w-6xl mx-auto grid gap-5
					{sectionData.columns == 2 ? 'grid-cols-1 md:grid-cols-2' : sectionData.columns == 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}">
					{#each sectionCards as card (card.id)}
						<div class="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1
							{sectionData.style === 'gradient'
								? 'bg-gradient-to-br from-surface-800 to-surface-900 border border-surface-700/50 hover:border-accent-500/30 shadow-lg hover:shadow-accent-500/5'
								: sectionData.style === 'bordered'
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

		<!-- STATS -->
		{:else if section.type === 'stats'}
			<section class="py-12 px-4">
				<div class="max-w-6xl mx-auto">
					{#if sectionData.title}
						<h2 class="text-2xl md:text-3xl font-bold text-white text-center mb-8">{sectionData.title}</h2>
					{/if}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{#each sectionItems as item (item.id)}
							<div class="rounded-2xl border border-surface-800 bg-surface-900/80 p-6 text-center">
								<div class="text-3xl font-bold text-accent-400 mb-1">{item.value}</div>
								<div class="text-sm font-semibold text-white">{item.label}</div>
								{#if item.description}<p class="text-xs text-surface-500 mt-2">{item.description}</p>{/if}
							</div>
						{/each}
					</div>
				</div>
			</section>

		<!-- FEATURES -->
		{:else if section.type === 'features'}
			<section class="py-12 px-4">
				<div class="max-w-5xl mx-auto">
					<div class="max-w-2xl mb-8">
						<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">{sectionData.title}</h2>
						{#if sectionData.intro}<p class="text-surface-400 leading-relaxed">{sectionData.intro}</p>{/if}
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each sectionItems as item (item.id)}
							<div class="flex gap-3 rounded-2xl border border-surface-800 bg-surface-900/70 p-5">
								<div class="mt-0.5 w-7 h-7 rounded-full bg-accent-500/15 text-accent-400 flex items-center justify-center shrink-0"><Check size={15} /></div>
								<div>
									<h3 class="font-semibold text-white mb-1">{item.title}</h3>
									<p class="text-sm text-surface-400 leading-relaxed">{item.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

		<!-- STEPS -->
		{:else if section.type === 'steps'}
			<section class="py-12 px-4">
				<div class="max-w-4xl mx-auto">
					<h2 class="text-2xl md:text-3xl font-bold text-white mb-8">{sectionData.title}</h2>
					<div class="space-y-4">
						{#each sectionItems as item, idx (item.id)}
							<div class="flex gap-4 rounded-2xl border border-surface-800 bg-surface-900/70 p-5">
								<div class="w-9 h-9 rounded-full bg-accent-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</div>
								<div>
									<h3 class="font-semibold text-white mb-1">{item.title}</h3>
									<p class="text-sm text-surface-400 leading-relaxed">{item.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

		<!-- TESTIMONIALS -->
		{:else if section.type === 'testimonials'}
			<section class="py-12 px-4">
				<div class="max-w-6xl mx-auto">
					<h2 class="text-2xl md:text-3xl font-bold text-white text-center mb-8">{sectionData.title}</h2>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
						{#each sectionItems as item (item.id)}
							<figure class="rounded-2xl border border-surface-800 bg-surface-900/80 p-6">
								<blockquote class="text-surface-300 leading-relaxed">"{item.quote}"</blockquote>
								<figcaption class="mt-5">
									<div class="font-semibold text-white text-sm">{item.name}</div>
									{#if item.role}<div class="text-xs text-surface-500">{item.role}</div>{/if}
								</figcaption>
							</figure>
						{/each}
					</div>
				</div>
			</section>

		<!-- PRICING -->
		{:else if section.type === 'pricing'}
			<section class="py-12 px-4">
				<div class="max-w-6xl mx-auto">
					<h2 class="text-2xl md:text-3xl font-bold text-white text-center mb-8">{sectionData.title}</h2>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
						{#each sectionItems as item (item.id)}
							<div class="rounded-2xl border border-surface-800 bg-surface-900/80 p-6 flex flex-col">
								<h3 class="text-lg font-bold text-white">{item.name}</h3>
								<div class="text-3xl font-bold text-accent-400 mt-3">{item.price}</div>
								<p class="text-sm text-surface-400 mt-2">{item.description}</p>
								<ul class="space-y-2 mt-5 mb-6 text-sm text-surface-300">
									{#each (item.features || '').split('\n').filter(Boolean) as feature}
										<li class="flex gap-2"><Check size={14} class="text-accent-400 mt-0.5 shrink-0" />{feature}</li>
									{/each}
								</ul>
								{#if item.buttonText}
									<a href={item.buttonUrl || '/'} class="mt-auto text-center px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors">{item.buttonText}</a>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</section>

		<!-- GALLERY -->
		{:else if section.type === 'gallery'}
			<section class="py-12 px-4">
				<div class="max-w-6xl mx-auto grid gap-4 {sectionData.columns == 2 ? 'grid-cols-1 md:grid-cols-2' : sectionData.columns == 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}">
					{#each sectionImages as image (image.id)}
						<figure class="rounded-2xl overflow-hidden border border-surface-800 bg-surface-900">
							{#if image.url}<img src={image.url} alt={image.alt || image.caption || ''} class="w-full aspect-video object-cover" loading="lazy" />{/if}
							{#if image.caption}<figcaption class="p-3 text-sm text-surface-400">{image.caption}</figcaption>{/if}
						</figure>
					{/each}
				</div>
			</section>

		<!-- CONTACT -->
		{:else if section.type === 'contact'}
			<section class="py-12 px-4">
				<div class="max-w-4xl mx-auto rounded-2xl border border-surface-800 bg-surface-900/80 p-8">
					<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">{sectionData.title}</h2>
					{#if sectionData.description}<p class="text-surface-400 mb-6">{sectionData.description}</p>{/if}
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						{#if sectionData.email}<a href="mailto:{sectionData.email}" class="flex items-center gap-2 text-surface-300 hover:text-accent-400"><Mail size={16} />{sectionData.email}</a>{/if}
						{#if sectionData.phone}<a href="tel:{sectionData.phone}" class="flex items-center gap-2 text-surface-300 hover:text-accent-400"><Phone size={16} />{sectionData.phone}</a>{/if}
						{#if sectionData.address}<span class="flex items-center gap-2 text-surface-300"><MapPin size={16} />{sectionData.address}</span>{/if}
					</div>
					{#if sectionData.buttonText}
						<a href={sectionData.buttonUrl || '/'} class="inline-flex mt-7 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors">{sectionData.buttonText}</a>
					{/if}
				</div>
			</section>

		<!-- EMBED -->
		{:else if section.type === 'embed'}
			<section class="py-12 px-4">
				<div class="max-w-5xl mx-auto">
					{#if sectionData.title}<h2 class="text-2xl md:text-3xl font-bold text-white mb-5">{sectionData.title}</h2>{/if}
					{#if sectionData.embedUrl}
						<div class="rounded-2xl overflow-hidden border border-surface-800 bg-surface-900 {sectionData.aspect === 'square' ? 'aspect-square' : sectionData.aspect === 'map' ? 'aspect-[16/10]' : 'aspect-video'}">
							<iframe src={sectionData.embedUrl} title={sectionData.title || 'Embedded content'} class="w-full h-full" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
						</div>
					{/if}
					{#if sectionData.caption}<p class="text-sm text-surface-500 mt-3">{sectionData.caption}</p>{/if}
				</div>
			</section>

		<!-- FAQ -->
		{:else if section.type === 'faq'}
			<section class="py-12 px-4">
				<div class="max-w-3xl mx-auto">
					{#if sectionData.title}
						<h2 class="text-2xl md:text-3xl font-bold text-white text-center mb-10">{sectionData.title}</h2>
					{/if}
					<div class="space-y-3">
						{#each sectionItems as item (item.id)}
							<div class="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden transition-colors
								{openFaq[item.id] ? 'border-accent-500/30' : 'hover:border-surface-700'}">
								<button
									type="button"
									id="faq-trigger-{item.id}"
									aria-expanded={openFaq[item.id] ? 'true' : 'false'}
									aria-controls="faq-panel-{item.id}"
									onclick={() => toggleFaq(item.id)}
									class="w-full flex items-center justify-between px-5 py-4 text-left"
								>
									<span class="text-sm font-medium text-white pr-4">{item.question}</span>
									<ChevronDown size={18}
										aria-hidden="true"
										class="text-surface-400 transition-transform flex-shrink-0
											{openFaq[item.id] ? 'rotate-180 text-accent-400' : ''}" />
								</button>
								{#if openFaq[item.id]}
									<div id="faq-panel-{item.id}" role="region" aria-labelledby="faq-trigger-{item.id}" class="px-5 pb-4 text-sm text-surface-400 leading-relaxed border-t border-surface-800 pt-3">
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
					{sectionData.style === 'gradient'
						? 'bg-gradient-to-br from-accent-600/20 via-surface-900 to-cyan-600/20 border border-accent-500/20'
						: sectionData.style === 'outlined'
							? 'border-2 border-surface-700'
							: 'bg-surface-800'}">
					<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">{sectionData.title}</h2>
					{#if sectionData.description}
						<p class="text-surface-400 max-w-xl mx-auto mb-8 leading-relaxed">{sectionData.description}</p>
					{/if}
					{#if sectionData.buttonText}
						<a href={sectionData.buttonUrl || '/'}
							class="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent-500 to-cyan-500 hover:from-accent-600 hover:to-cyan-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
							{sectionData.buttonText}
						</a>
					{/if}
				</div>
			</section>

		<!-- DIVIDER -->
		{:else if section.type === 'divider'}
			<div class="max-w-4xl mx-auto px-4
				{sectionData.spacing === 'small' ? 'py-4' : sectionData.spacing === 'large' ? 'py-16' : 'py-8'}">
				{#if sectionData.style === 'line'}
					<hr class="border-surface-800" />
				{:else if sectionData.style === 'dots'}
					<div class="flex items-center justify-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-surface-600"></span>
						<span class="w-1.5 h-1.5 rounded-full bg-surface-600"></span>
						<span class="w-1.5 h-1.5 rounded-full bg-surface-600"></span>
					</div>
				{:else if sectionData.style === 'gradient'}
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
