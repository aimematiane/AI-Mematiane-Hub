<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Brain, Sparkles, Newspaper, BookOpen, ArrowRight } from '@lucide/svelte';
</script>

<SeoHead
	title="AI Mematiane — Global Directory of AI Tools, News & Analysis"
	description="AI Mematiane - Your global directory of AI models, tools, news, and deep-dive analysis"
	url="/"
/>

<svelte:head>
	<script type="application/ld+json">
		{JSON.stringify({
			"@context": "https://schema.org",
			"@graph": [
				{
					"@type": "Organization",
					"@id": "https://ai-mematiane.com/#organization",
					"name": "AI Mematiane",
					"url": "https://ai-mematiane.com",
					"logo": {
						"@type": "ImageObject",
						"url": "https://ai-mematiane.com/logo.png"
					},
					"sameAs": [
						"https://x.com/AIMematiane",
						"https://github.com/aimematiane",
						"https://www.linkedin.com/in/ai-mematiane-879538415/"
					]
				},
				{
					"@type": "WebSite",
					"@id": "https://ai-mematiane.com/#website",
					"url": "https://ai-mematiane.com",
					"name": "AI Mematiane",
					"publisher": {
						"@id": "https://ai-mematiane.com/#organization"
					},
					"potentialAction": {
						"@type": "SearchAction",
						"target": {
							"@type": "EntryPoint",
							"urlTemplate": "https://ai-mematiane.com/ai-tools?q={search_term_string}"
						},
						"query-input": "required name=search_term_string"
					}
				}
			]
		})}
	</script>
</svelte:head>

<section class="relative overflow-hidden pt-24 pb-28">
	<!-- Ambient Glowing Orbs -->
	<div class="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent-500/10 glow-orb animate-float-slow"></div>
	<div class="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/10 glow-orb animate-float-slow-reverse"></div>
	<div class="absolute inset-0 bg-gradient-to-b from-transparent via-surface-950/40 to-surface-950 pointer-events-none"></div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
		<div class="text-center max-w-3xl mx-auto">
			<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm mb-8 animate-fade-in-up">
				<Sparkles size={14} class="animate-pulse" />
				The AI Chronicles Platform
			</div>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up delay-100">
				Discover the Future of
				<span class="bg-gradient-to-r from-accent-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent"> Artificial Intelligence</span>
			</h1>
			<p class="text-lg text-surface-400 leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200">
				Explore cutting-edge AI tools, stay informed with the latest news, and dive deep into expert analysis. Your single destination for everything AI.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
				<a href="/ai-tools" class="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-cyan-500 hover:from-accent-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-accent-500/20 hover:shadow-accent-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
					Explore AI Tools
					<ArrowRight size={18} class="transition-transform duration-300 group-hover:translate-x-1" />
				</a>
				<a href="/news" class="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
					<Newspaper size={18} />
					Latest News
				</a>
			</div>
		</div>
	</div>
</section>

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 relative z-10">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<a href="/ai-tools" class="glass-card group p-8 rounded-2xl animate-fade-in-up delay-100">
			<div class="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mb-6 group-hover:bg-accent-500/20 transition-all duration-300 group-hover:scale-110">
				<Brain size={24} class="text-accent-400" />
			</div>
			<h2 class="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-accent-400 transition-colors">AI Showcase</h2>
			<p class="text-sm text-surface-400 leading-relaxed">Browse a curated directory of AI models and tools across text, image, video, audio, code, and more.</p>
		</a>
		<a href="/news" class="glass-card group p-8 rounded-2xl animate-fade-in-up delay-200">
			<div class="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6 group-hover:bg-rose-500/20 transition-all duration-300 group-hover:scale-110">
				<Newspaper size={24} class="text-rose-400" />
			</div>
			<h2 class="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-rose-400 transition-colors">AI News</h2>
			<p class="text-sm text-surface-400 leading-relaxed">Stay up to date with breaking developments, research breakthroughs, and industry movements in AI.</p>
		</a>
		<a href="/blog" class="glass-card group p-8 rounded-2xl animate-fade-in-up delay-300">
			<div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-all duration-300 group-hover:scale-110">
				<BookOpen size={24} class="text-emerald-400" />
			</div>
			<h2 class="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-emerald-400 transition-colors">Deep Dives</h2>
			<p class="text-sm text-surface-400 leading-relaxed">In-depth articles exploring AI technologies, ethics, applications, and the future of intelligent systems.</p>
		</a>
	</div>
</section>
