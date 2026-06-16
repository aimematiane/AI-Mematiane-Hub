<script>
	import { 
		Bold, Italic, Heading, Code, Link, Image, 
		List, ListOrdered, Quote, Eye, Edit3 
	} from '@lucide/svelte';
	import { renderMarkdown } from '$lib/utils/marked';

	let { value = $bindable(''), placeholder = 'Write your content here...', rows = 12, id = '' } = $props();

	let activeTab = $state('write'); // 'write' or 'preview'
	let textareaRef = $state(null);

	function insertFormatting(prefix, suffix = '') {
		if (!textareaRef) return;
		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const text = textareaRef.value;
		const selectedText = text.substring(start, end);
		const replacement = prefix + selectedText + suffix;
		
		value = text.substring(0, start) + replacement + text.substring(end);
		
		// Wait for binding to update and restore cursor selection
		setTimeout(() => {
			textareaRef.focus();
			const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
			textareaRef.setSelectionRange(start + prefix.length, newCursorPos - suffix.length);
		}, 0);
	}

	function wrapText(wrapper) {
		insertFormatting(wrapper, wrapper);
	}

	function insertLinePrefix(prefix) {
		if (!textareaRef) return;
		const start = textareaRef.selectionStart;
		const text = textareaRef.value;
		// Find start of current line
		const beforeText = text.substring(0, start);
		const lineStart = beforeText.lastIndexOf('\n') + 1;
		
		value = text.substring(0, lineStart) + prefix + text.substring(lineStart);
		
		setTimeout(() => {
			textareaRef.focus();
			textareaRef.setSelectionRange(start + prefix.length, start + prefix.length);
		}, 0);
	}
</script>

<div class="rounded-xl border border-white/5 bg-surface-900 overflow-hidden shadow-inner flex flex-col">
	<!-- Toolbar / Tabs Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 bg-surface-950/40 px-3 py-2 gap-2">
		<!-- Formatting buttons -->
		<div class="flex items-center gap-1 flex-wrap">
			{#if activeTab === 'write'}
				<button 
					type="button" 
					onclick={() => wrapText('**')} 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Bold"
				>
					<Bold size={15} />
				</button>
				<button 
					type="button" 
					onclick={() => wrapText('*')} 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Italic"
				>
					<Italic size={15} />
				</button>
				<button 
					type="button" 
					onclick={() => insertLinePrefix('### ')} 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Heading"
				>
					<Heading size={15} />
				</button>
				<button 
					type="button" 
					onclick={() => wrapText('`')} 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Code Inline"
				>
					<Code size={15} />
				</button>
				<div class="h-4 w-px bg-white/5 mx-1"></div>
				<button 
					type="button" 
					onclick={() => insertFormatting('[', '](url)')} 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Link"
				>
					<Link size={15} />
				</button>
				<button 
					type="button" 
					onclick={() => insertFormatting('![alt](', ')') } 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Image Link"
				>
					<Image size={15} />
				</button>
				<div class="h-4 w-px bg-white/5 mx-1"></div>
				<button 
					type="button" 
					onclick={() => insertLinePrefix('- ')} 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Bullet List"
				>
					<List size={15} />
				</button>
				<button 
					type="button" 
					onclick={() => insertLinePrefix('1. ')} 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Numbered List"
				>
					<ListOrdered size={15} />
				</button>
				<button 
					type="button" 
					onclick={() => insertLinePrefix('> ')} 
					class="p-1.5 rounded hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
					title="Blockquote"
				>
					<Quote size={15} />
				</button>
			{:else}
				<span class="text-xs font-semibold text-accent-400 px-2 py-1 bg-accent-500/10 rounded-md">Live Preview Mode</span>
			{/if}
		</div>

		<!-- Tab Buttons -->
		<div class="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/5">
			<button 
				type="button"
				onclick={() => activeTab = 'write'}
				class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all {activeTab === 'write' ? 'bg-surface-800 text-white shadow-sm' : 'text-surface-400 hover:text-white'}"
			>
				<Edit3 size={12} />
				Write
			</button>
			<button 
				type="button"
				onclick={() => activeTab = 'preview'}
				class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all {activeTab === 'preview' ? 'bg-surface-800 text-white shadow-sm' : 'text-surface-400 hover:text-white'}"
			>
				<Eye size={12} />
				Preview
			</button>
		</div>
	</div>

	<!-- Content Area -->
	<div class="flex-1 min-h-[200px]">
		{#if activeTab === 'write'}
			<textarea 
				id={id || undefined}
				bind:this={textareaRef}
				bind:value={value}
				{placeholder}
				{rows}
				class="w-full h-full min-h-[300px] p-4 bg-transparent text-white text-sm focus:outline-none resize-y font-mono leading-relaxed placeholder-surface-600 border-0 outline-none focus:ring-0 focus:border-0"
			></textarea>
		{:else}
			<div class="prose max-w-none p-4 max-h-[500px] overflow-y-auto text-surface-300 text-sm leading-relaxed prose-invert scrollbar-thin">
				{#if value.trim()}
					{@html renderMarkdown(value)}
				{:else}
					<p class="text-surface-500 italic">Nothing to preview yet. Write some markdown content first!</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
