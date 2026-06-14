<script>
	let { category, size = 'sm' } = $props();

	const categoryColors = {
		text: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
		image: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
		video: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
		audio: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
		code: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
		data: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
		general: 'bg-surface-500/20 text-surface-400 border-surface-500/30',
		other: 'bg-surface-500/20 text-surface-400 border-surface-500/30'
	};

	const sizeClasses = {
		xs: 'text-xs px-2 py-0.5',
		sm: 'text-xs px-2.5 py-1',
		md: 'text-sm px-3 py-1.5'
	};

	const colorClass = $derived(categoryColors[category] || categoryColors.general);
</script>

<span class="inline-block rounded-full border font-medium {colorClass} {sizeClasses[size]}">
	{category}
</span>
