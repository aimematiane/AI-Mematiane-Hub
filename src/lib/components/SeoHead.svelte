<script>
	import { page } from '$app/stores';
	import { SITE_URL, absoluteUrl, resolveMetaTitle, resolveMetaDescription } from '$lib/config/site.js';

	let {
		title = '',
		description = '',
		url = '/',
		image = '',
		type = 'website',
		publishedTime = '',
		modifiedTime = '',
		authorName = '',
		tags = [],
		noindex = false,
		preloadImage = '',
		prevUrl = '',
		nextUrl = '',
		schemaType = '',
		customSchema = null,
		imageWidth = 1200,
		imageHeight = 675,
		imageAlt = ''
	} = $props();

	const site = $derived($page.data.site || {});
	const siteName = $derived(site.site_name || 'AI Mematiane');
	const siteDescription = $derived(site.site_description || 'AI Mematiane is a global directory of AI tools, news and analysis.');
	const siteLogo = $derived(site.logo_url || '/logo.png');
	const siteFavicon = $derived(site.favicon_url || '/favicon.svg');
	const defaultImage = $derived(site.og_image_url || '');
	const resolvedUrl = $derived(absoluteUrl(url));
	const resolvedImage = $derived(image ? absoluteUrl(image) : defaultImage ? absoluteUrl(defaultImage) : '');
	const metaTitle = $derived(resolveMetaTitle(title, siteName));
	const metaDescription = $derived(resolveMetaDescription(description, siteDescription));
	const canonicalUrl = $derived(resolvedUrl || SITE_URL);
	const resolvedPrevUrl = $derived(prevUrl ? absoluteUrl(prevUrl) : '');
	const resolvedNextUrl = $derived(nextUrl ? absoluteUrl(nextUrl) : '');
	const resolvedImageAlt = $derived(imageAlt || metaTitle);

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

	const structuredData = $derived.by(() => {
		if (!customSchema) return articleSchema;
		if (typeof customSchema !== 'string') return customSchema;
		try {
			return JSON.parse(customSchema);
		} catch {
			return null;
		}
	});
</script>

<svelte:head>
	<title>{metaTitle}</title>
	<meta name="description" content={metaDescription} />
	<meta name="theme-color" content="#0f172a" />
	<meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'} />
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
		<meta property="og:image:alt" content={resolvedImageAlt} />
		<meta property="twitter:image" content={resolvedImage} />
		<meta name="twitter:image:alt" content={resolvedImageAlt} />
	{/if}
	{#if type === 'article' && publishedTime}
		<meta property="article:published_time" content={publishedTime} />
	{/if}
	{#if type === 'article' && modifiedTime}
		<meta property="article:modified_time" content={modifiedTime} />
	{/if}
	{#if type === 'article' && authorName}
		<meta property="article:author" content={authorName} />
	{/if}
	{#if type === 'article' && tags?.length > 0}
		{#each tags as tag}
			<meta property="article:tag" content={tag} />
		{/each}
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={metaTitle} />
	<meta name="twitter:description" content={metaDescription} />
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
	{#if structuredData}
		<script type="application/ld+json">
			{JSON.stringify(structuredData)}
		</script>
	{/if}
</svelte:head>
