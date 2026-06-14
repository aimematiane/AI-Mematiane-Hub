<script>
	import { Brain } from '@lucide/svelte';
</script>

<footer class="border-t border-surface-800 bg-surface-950">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
			<div class="md:col-span-1">
				<a href="/" class="flex items-center gap-2 mb-4">
					<Brain size={24} class="text-accent-400" />
					<span class="text-lg font-bold text-white">AI Mematiane</span>
				</a>
				<p class="text-sm text-surface-400 leading-relaxed">
					Your global directory of AI models, tools, news, and deep-dive analysis. Stay ahead of the curve.
				</p>
			</div>

			<div>
				<h4 class="text-sm font-semibold text-white mb-3">Explore</h4>
				<ul class="space-y-2">
					<li><a href="/ai-tools" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">AI Showcase</a></li>
					<li><a href="/news" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">News</a></li>
					<li><a href="/blog" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">Blog</a></li>
				</ul>
			</div>

			<div>
				<h4 class="text-sm font-semibold text-white mb-3">Account</h4>
				<ul class="space-y-2">
					<li><a href="/profile" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">Profile</a></li>
					<li><a href="/profile/bookmarks" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">Bookmarks</a></li>
					<li><a href="/auth/login" class="text-sm text-surface-400 hover:text-accent-400 transition-colors">Login</a></li>
				</ul>
			</div>

			<div>
				<h4 class="text-sm font-semibold text-white mb-3">Connect</h4>
				<div class="flex items-center gap-3">
					<a href="#" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all" aria-label="GitHub">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5.5-1-7-2"/></svg>
					</a>
					<a href="#" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all" aria-label="X (Twitter)">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
					</a>
					<a href="#" class="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-all" aria-label="LinkedIn">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
					</a>
				</div>
			</div>
		</div>

		<div class="border-t border-surface-800 mt-8 pt-8 text-center">
			<p class="text-xs text-surface-500">&copy; {new Date().getFullYear()} AI Mematiane. All rights reserved.</p>
		</div>
	</div>
</footer>
