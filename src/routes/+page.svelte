<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { Brain, Sparkles, Newspaper, BookOpen, ArrowRight } from '@lucide/svelte';
</script>

<SeoHead
	title="Home"
	description="AI Mematiane - Your global directory of AI models, tools, news, and deep-dive analysis"
/>

<section class="relative overflow-hidden">
	<div class="absolute inset-0 bg-gradient-to-b from-accent-500/5 via-transparent to-transparent pointer-events-none"></div>
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
		<div class="text-center max-w-3xl mx-auto">
			<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm mb-8">
				<Sparkles size={14} />
				The AI Chronicles Platform
			</div>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
				Discover the Future of
				<span class="bg-gradient-to-r from-accent-400 to-cyan-300 bg-clip-text text-transparent"> Artificial Intelligence</span>
			</h1>
			<p class="text-lg text-surface-400 leading-relaxed mb-10 max-w-2xl mx-auto">
				Explore cutting-edge AI tools, stay informed with the latest news, and dive deep into expert analysis. Your single destination for everything AI.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
				<a href="/ai-tools" class="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium transition-all hover:shadow-lg hover:shadow-accent-500/25">
					Explore AI Tools
					<ArrowRight size={18} />
				</a>
				<a href="/news" class="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 font-medium transition-all border border-surface-700">
					<Newspaper size={18} />
					Latest News
				</a>
			</div>
		</div>
	</div>
</section>

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<a href="/ai-tools" class="group p-6 rounded-2xl bg-surface-900 border border-surface-800 hover:border-accent-500/30 transition-all hover:shadow-lg hover:shadow-accent-500/5">
			<div class="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4 group-hover:bg-accent-500/20 transition-colors">
				<Brain size={20} class="text-accent-400" />
			</div>
			<h2 class="text-lg font-semibold text-white mb-2">AI Showcase</h2>
			<p class="text-sm text-surface-400 leading-relaxed">Browse a curated directory of AI models and tools across text, image, video, audio, code, and more.</p>
		</a>
		<a href="/news" class="group p-6 rounded-2xl bg-surface-900 border border-surface-800 hover:border-rose-500/30 transition-all hover:shadow-lg hover:shadow-rose-500/5">
			<div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4 group-hover:bg-rose-500/20 transition-colors">
				<Newspaper size={20} class="text-rose-400" />
			</div>
			<h2 class="text-lg font-semibold text-white mb-2">AI News</h2>
			<p class="text-sm text-surface-400 leading-relaxed">Stay up to date with breaking developments, research breakthroughs, and industry movements in AI.</p>
		</a>
		<a href="/blog" class="group p-6 rounded-2xl bg-surface-900 border border-surface-800 hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
			<div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
				<BookOpen size={20} class="text-emerald-400" />
			</div>
			<h2 class="text-lg font-semibold text-white mb-2">Deep Dives</h2>
			<p class="text-sm text-surface-400 leading-relaxed">In-depth articles exploring AI technologies, ethics, applications, and the future of intelligent systems.</p>
		</a>
	</div>
</section>
