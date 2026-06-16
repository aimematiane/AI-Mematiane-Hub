<script>
  import "./layout.css";
  import Nav from "$lib/components/Nav.svelte";
  import Footer from "$lib/components/Footer.svelte";

  const { children } = $props();
</script>



<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-600 focus:text-white focus:rounded-md focus:shadow-md">
  Skip to main content
</a>

<div class="min-h-screen flex flex-col">
  <Nav />
  <main id="main-content" class="flex-1">
    {@render children()}
  </main>
  <Footer />
</div>
