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
    preloadImage = ''
  } = $props();

  const baseUrl = 'https://ai-mematiane.com';
  let resolvedUrl = $state('');
  let resolvedImage = $state('');
  let metaTitle = $state('');
  let metaDescription = $state('');
  let canonicalUrl = $state('');

  $effect(() => {
    resolvedUrl = url?.startsWith('http') ? url : `${baseUrl}${url}`;
    resolvedImage = image
      ? image.startsWith('http')
        ? image
        : `${baseUrl}${image}`
      : '';
    metaTitle = title ? title : 'AI Mematiane';
    metaDescription = description
      ? description
      : 'AI Mematiane is a global directory of AI tools, news and analysis.';
    canonicalUrl = resolvedUrl || baseUrl;
  });
</script>

<svelte:head>
  <title>{metaTitle}</title>
  <meta name="description" content={metaDescription} />
  <meta name="theme-color" content="#0f172a" />
  <meta property="og:title" content={metaTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:type" content={type} />
  <meta property="og:url" content={canonicalUrl} />
  {#if resolvedImage}
    <meta property="og:image" content={resolvedImage} />
    <meta property="og:image:secure_url" content={resolvedImage} />
    <meta property="twitter:image" content={resolvedImage} />
  {/if}
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:title" content={metaTitle} />
  <meta property="twitter:description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" href={canonicalUrl} hreflang="en" />
  <link rel="alternate" href="https://ai-mematiane.com/" hreflang="x-default" />
  {#if preloadImage}
    <link rel="preload" as="image" href={preloadImage} />
  {/if}
  {#if noindex}
    <meta name="robots" content="noindex,nofollow" />
  {/if}
</svelte:head>
