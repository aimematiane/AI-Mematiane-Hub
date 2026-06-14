<script>
	let {
		title = 'AI Mematiane',
		description = 'AI Chronicles - Your global directory of AI models, tools, news, and deep-dive analysis',
		image = '/favicon.svg',
		url = '',
		type = 'website',
		publishedTime = '',
		authorName = '',
		tags = []
	} = $props();

	const siteUrl = import.meta.env.VITE_SITE_URL || 'https://ai-mematiane.com';
	const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
	const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

	const schema = type === 'article' ? JSON.stringify({
		'@context': 'https://schema.org',
		'@type': authorName ? 'Article' : 'WebPage',
		headline: title,
		description: description,
		image: fullImage,
		url: fullUrl,
		...(publishedTime && { datePublished: publishedTime }),
		...(authorName && { author: { '@type': 'Person', name: authorName } }),
		publisher: {
			'@type': 'Organization',
			name: 'AI Mematiane',
			logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.svg` }
		}
	}) : '';
</script>

<svelte:head>
	<title>{title} | AI Mematiane</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={tags.join(', ')} />

	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={fullImage} />
	<meta property="og:url" content={fullUrl} />
	<meta property="og:site_name" content="AI Mematiane" />
	{#if publishedTime}
		<meta property="article:published_time" content={publishedTime} />
	{/if}
	{#if tags.length > 0}
		{#each tags as tag}
			<meta property="article:tag" content={tag} />
		{/each}
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={fullImage} />

	<link rel="canonical" href={fullUrl} />

	{#if schema}
		<script type="application/ld+json">{schema}</script>
	{/if}
</svelte:head>
