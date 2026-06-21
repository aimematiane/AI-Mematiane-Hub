<script>
	let { size = 24, class: className = '', strokeWidth = 2 } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	<rect x="2" y="4" width="20" height="16" rx="2" />
	<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
</svg>
