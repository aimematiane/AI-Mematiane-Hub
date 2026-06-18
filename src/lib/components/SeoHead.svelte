<script>
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
		schemaType = ''
	} = $props();

	const baseUrl = 'https://ai-mematiane.com';

	const resolvedUrl = $derived(url?.startsWith('http') ? url : `${baseUrl}${url}`);
	const resolvedImage = $derived(image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : '');
	const metaTitle = $derived(title || 'AI Mematiane');
	const metaDescription = $derived(description || 'AI Mematiane is a global directory of AI tools, news and analysis.');
	const canonicalUrl = $derived(resolvedUrl || baseUrl);
	const resolvedPrevUrl = $derived(prevUrl ? (prevUrl.startsWith('http') ? prevUrl : `${baseUrl}${prevUrl}`) : '');
	const resolvedNextUrl = $derived(nextUrl ? (nextUrl.startsWith('http') ? nextUrl : `${baseUrl}${nextUrl}`) : '');
	const structuredData = $derived(
		schemaType === 'Article'
			? {
					'@context': 'https://schema.org',
					'@type': 'Article',
					headline: metaTitle,
					description: metaDescription,
					url: canonicalUrl,
					...(resolvedImage ? { image: resolvedImage } : {}),
					...(publishedTime ? { datePublished: publishedTime } : {}),
					...(authorName ? { author: { '@type': 'Person', name: authorName } } : {}),
					publisher: {
						'@type': 'Organization',
						name: 'AI Mematiane',
						logo: {
							'@type': 'ImageObject',
							url: `${baseUrl}/logo.png`
						}
					}
				}
			: null
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
	<meta property="og:site_name" content="AI Mematiane" />
	<meta property="og:locale" content="en_US" />
	{#if resolvedImage}
		<meta property="og:image" content={resolvedImage} />
		<meta property="og:image:secure_url" content={resolvedImage} />
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
	<link rel="alternate" href="https://ai-mematiane.com/" hreflang="x-default" />
	{#if resolvedPrevUrl}
		<link rel="prev" href={resolvedPrevUrl} />
	{/if}
	{#if resolvedNextUrl}
		<link rel="next" href={resolvedNextUrl} />
	{/if}
	{#if preloadImage}
		<link rel="preload" as="image" href={preloadImage} />
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
