<script>
	import { page } from '$app/stores';
	import { SITE_URL, absoluteUrl } from '$lib/config/site.js';

	let {
		title = '',
		description = '',
		url = '/',
		image = '',
		type = 'website',
		publishedTime = '',
		authorName = '',
		tags = [],
		noindex = false,
		preloadImage = '',
		prevUrl = '',
		nextUrl = '',
		schemaType = '',
		customSchema = null,
		imageWidth = 1200,
		imageHeight = 675
	} = $props();

	const site = $derived($page.data.site || {});
	const siteName = $derived(site.site_name || 'AI Mematiane');
	const siteDescription = $derived(site.site_description || 'AI Mematiane is a global directory of AI tools, news and analysis.');
	const siteLogo = $derived(site.logo_url || '/logo.png');
	const siteFavicon = $derived(site.favicon_url || '/favicon.svg');
	const defaultImage = $derived(site.og_image_url || '');
	const resolvedUrl = $derived(absoluteUrl(url));
	const resolvedImage = $derived(image ? absoluteUrl(image) : defaultImage ? absoluteUrl(defaultImage) : '');
	const metaTitle = $derived(title || siteName);
	const metaDescription = $derived(description || siteDescription);
	const canonicalUrl = $derived(resolvedUrl || SITE_URL);
	const resolvedPrevUrl = $derived(prevUrl ? absoluteUrl(prevUrl) : '');
	const resolvedNextUrl = $derived(nextUrl ? absoluteUrl(nextUrl) : '');

	const articleSchema = $derived(
		schemaType === 'Article' || schemaType === 'NewsArticle'
			? {
					'@context': 'https://schema.org',
					'@type': schemaType === 'NewsArticle' ? 'NewsArticle' : 'Article',
					headline: metaTitle,
					description: metaDescription,
					url: canonicalUrl,
					...(resolvedImage ? { image: resolvedImage } : {}),
					...(publishedTime ? { datePublished: publishedTime } : {}),
					...(authorName ? { author: { '@type': 'Person', name: authorName } } : {}),
					publisher: {
						'@type': 'Organization',
						name: siteName,
						logo: {
							'@type': 'ImageObject',
							url: absoluteUrl(siteLogo)
						}
					}
				}
			: null
	);

	const structuredData = $derived(
		customSchema
			? typeof customSchema === 'string'
				? JSON.parse(customSchema)
				: customSchema
			: articleSchema
	);
</script>

<svelte:head>
	<title>{metaTitle}</title>
	<meta name="description" content={metaDescription} />
	<meta name="theme-color" content="#0f172a" />
	<meta property="og:title" content={metaTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content="en_US" />
	<link rel="icon" href={absoluteUrl(siteFavicon)} />
	<link rel="apple-touch-icon" href={absoluteUrl(siteLogo)} />
	{#if resolvedImage}
		<meta property="og:image" content={resolvedImage} />
		<meta property="og:image:secure_url" content={resolvedImage} />
		<meta property="og:image:width" content={String(imageWidth)} />
		<meta property="og:image:height" content={String(imageHeight)} />
		<meta property="twitter:image" content={resolvedImage} />
	{/if}
	{#if type === 'article' && publishedTime}
		<meta property="article:published_time" content={publishedTime} />
	{/if}
	{#if type === 'article' && authorName}
		<meta property="article:author" content={authorName} />
	{/if}
	{#if type === 'article' && tags?.length > 0}
		{#each tags as tag}
			<meta property="article:tag" content={tag} />
		{/each}
	{/if}
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:title" content={metaTitle} />
	<meta property="twitter:description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="alternate" href={canonicalUrl} hreflang="en" />
	<link rel="alternate" href={canonicalUrl} hreflang="x-default" />
	{#if resolvedPrevUrl}
		<link rel="prev" href={resolvedPrevUrl} />
	{/if}
	{#if resolvedNextUrl}
		<link rel="next" href={resolvedNextUrl} />
	{/if}
	{#if preloadImage}
		<link rel="preload" as="image" href={absoluteUrl(preloadImage)} />
	{/if}
	{#if noindex}
		<meta name="robots" content="noindex,nofollow" />
	{/if}
	{#if structuredData}
		<script type="application/ld+json">
			{JSON.stringify(structuredData)}
		</script>
	{/if}
</svelte:head>
