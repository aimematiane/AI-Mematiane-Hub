<script>
  import "./layout.css";
  import Nav from "$lib/components/Nav.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { dev } from '$app/environment';
  import { page } from '$app/stores';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

  injectAnalytics({ mode: dev ? 'development' : 'production' });
  injectSpeedInsights();

  let { children, data } = $props();
  const isAdminRoute = $derived($page.url.pathname.startsWith('/admin'));

  // Apply theme CSS variables when data changes
  $effect(() => {
    if (data.theme && typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [variable, value] of Object.entries(data.theme)) {
        root.style.setProperty(variable, value);
      }
    }
  });
</script>

<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-600 focus:text-white focus:rounded-md focus:shadow-md">
  Skip to main content
</a>

<div class="min-h-screen flex flex-col">
  <Nav navPages={data.navPages} user={data.user} profile={data.profile} />
  <main id="main-content" class="flex-1">
    {@render children()}
  </main>
  {#if !isAdminRoute}
    <Footer footer={data.footer} />
  {/if}
</div>

