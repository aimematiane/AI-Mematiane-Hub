<script>
	import { goto, invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import {
		FileText, Save, Globe, EyeOff, Trash2, ArrowLeft, AlertCircle, CheckCircle2,
		Eye, Navigation, Plus, GripVertical, ChevronUp, ChevronDown, X,
		Type, LayoutGrid, HelpCircle, Megaphone, Minus, AlignCenter, Copy,
		Image as ImageIcon, BarChart3, ListChecks, Quote, DollarSign, MapPin,
		Code2, Link as LinkIcon
	} from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { sanitizeHtml } from '$lib/utils/marked.js';

	let { data, form } = $props();

	let page = $state({});
	let saving = $state(false);
	let publishing = $state(false);
	let deleting = $state(false);
	let toast = $state(null);
	let activeSection = $state(null);
	let showAddMenu = $state(false);

	let sections = $state([]);

	$effect(() => {
		page = { ...data.page };
		sections = Array.isArray(data.page.sections) && data.page.sections.length > 0
			? data.page.sections
			: [];
	});

	function showToast(msg, type = 'success') {
		toast = { msg, type };
		setTimeout(() => (toast = null), 3000);
	}

	$effect(() => {
		if (form?.success) showToast('Saved successfully!');
		if (form?.error) showToast(form.error, 'error');
	});

	// Section types configuration
	const sectionTypes = [
		{ type: 'hero', label: 'Hero Banner', icon: Type, description: 'Title, subtitle and optional buttons' },
		{ type: 'rich_text', label: 'Text Editor', icon: FileText, description: 'Formatted long-form content' },
		{ type: 'media_text', label: 'Image + Text', icon: ImageIcon, description: 'Split content with media' },
		{ type: 'cards', label: 'Cards Grid', icon: LayoutGrid, description: 'Services, features or resources' },
		{ type: 'stats', label: 'Stats', icon: BarChart3, description: 'Numbers and proof points' },
		{ type: 'features', label: 'Feature List', icon: ListChecks, description: 'Compact benefit list' },
		{ type: 'steps', label: 'Steps', icon: GripVertical, description: 'Process, itinerary or timeline' },
		{ type: 'testimonials', label: 'Testimonials', icon: Quote, description: 'Quotes, reviews or references' },
		{ type: 'pricing', label: 'Pricing', icon: DollarSign, description: 'Plans, packages or offers' },
		{ type: 'gallery', label: 'Gallery', icon: ImageIcon, description: 'Image gallery with captions' },
		{ type: 'contact', label: 'Contact Block', icon: MapPin, description: 'Email, phone, address and CTA' },
		{ type: 'embed', label: 'Embed', icon: Code2, description: 'Maps, video or iframe embed' },
		{ type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Collapsible Q&A' },
		{ type: 'cta', label: 'Call to Action', icon: Megaphone, description: 'Banner with button' },
		{ type: 'divider', label: 'Divider', icon: Minus, description: 'Visual separator' },
	];

	function genId() {
		return crypto.randomUUID();
	}

	function getDefaultData(type) {
		switch (type) {
			case 'hero': return { title: 'Your Heading', subtitle: 'Add a description here', alignment: 'center', size: 'large', primaryText: 'Get Started', primaryUrl: '/', secondaryText: '', secondaryUrl: '' };
			case 'rich_text': return { content: '<p>Start writing your content here...</p>' };
			case 'media_text': return { eyebrow: '', title: 'Tell your story visually', text: 'Use this block for destinations, product details, services, case studies, or important announcements.', imageUrl: '', imageAlt: '', mediaPosition: 'left', buttonText: '', buttonUrl: '' };
			case 'cards': return { columns: 3, style: 'default', cards: [
				{ id: genId(), icon: '🚀', title: 'Card Title', description: 'Card description goes here.' },
				{ id: genId(), icon: '⚡', title: 'Card Title', description: 'Card description goes here.' },
				{ id: genId(), icon: '🎯', title: 'Card Title', description: 'Card description goes here.' }
			]};
			case 'stats': return { title: 'Key numbers', items: [
				{ id: genId(), value: '100+', label: 'Projects', description: 'Delivered successfully' },
				{ id: genId(), value: '24/7', label: 'Support', description: 'Always available' },
				{ id: genId(), value: '5★', label: 'Rating', description: 'Trusted by customers' }
			]};
			case 'features': return { title: 'What you get', intro: 'Use this for benefits, inclusions, services or highlights.', items: [
				{ id: genId(), title: 'Important feature', description: 'Short explanation of the value.' },
				{ id: genId(), title: 'Another benefit', description: 'Short explanation of the value.' }
			]};
			case 'steps': return { title: 'How it works', items: [
				{ id: genId(), title: 'First step', description: 'Explain what happens here.' },
				{ id: genId(), title: 'Second step', description: 'Explain the next part.' }
			]};
			case 'testimonials': return { title: 'What people say', items: [
				{ id: genId(), quote: 'A short testimonial or review goes here.', name: 'Customer Name', role: 'Role or company' }
			]};
			case 'pricing': return { title: 'Plans', items: [
				{ id: genId(), name: 'Starter', price: '$49', description: 'For small projects', features: 'Feature one\nFeature two\nFeature three', buttonText: 'Choose Plan', buttonUrl: '/' }
			]};
			case 'gallery': return { columns: 3, images: [
				{ id: genId(), url: '', alt: '', caption: 'Gallery caption' }
			]};
			case 'contact': return { title: 'Contact us', description: 'Add your contact details or booking information.', email: '', phone: '', address: '', buttonText: 'Send Message', buttonUrl: '/contact' };
			case 'embed': return { title: 'Embedded content', embedUrl: '', aspect: 'video', caption: '' };
			case 'faq': return { title: 'Frequently Asked Questions', items: [
				{ id: genId(), question: 'What is this about?', answer: 'This is an answer to the question.' }
			]};
			case 'cta': return { title: 'Ready to get started?', description: 'Join us today and explore what we have to offer.', buttonText: 'Get Started', buttonUrl: '/', style: 'gradient' };
			case 'divider': return { style: 'line', spacing: 'medium' };
			default: return {};
		}
	}

	function addSection(type) {
		const newSection = { id: genId(), type, data: getDefaultData(type) };
		sections = [...sections, newSection];
		activeSection = newSection.id;
		showAddMenu = false;
	}

	function removeSection(id) {
		sections = sections.filter(s => s.id !== id);
		if (activeSection === id) activeSection = null;
	}

	function duplicateSection(id) {
		const idx = sections.findIndex(s => s.id === id);
		if (idx === -1) return;
		const clone = JSON.parse(JSON.stringify(sections[idx]));
		clone.id = genId();
		sections = [...sections.slice(0, idx + 1), clone, ...sections.slice(idx + 1)];
		activeSection = clone.id;
	}

	function moveSection(id, direction) {
		const idx = sections.findIndex(s => s.id === id);
		if (idx === -1) return;
		const newIdx = idx + direction;
		if (newIdx < 0 || newIdx >= sections.length) return;
		const arr = [...sections];
		[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
		sections = arr;
	}

	function addCard(sectionId) {
		sections = sections.map(s => {
			if (s.id === sectionId && s.type === 'cards') {
				return { ...s, data: { ...s.data, cards: [...s.data.cards, { id: genId(), icon: '✨', title: 'New Card', description: 'Description' }] } };
			}
			return s;
		});
	}

	function removeCard(sectionId, cardId) {
		sections = sections.map(s => {
			if (s.id === sectionId && s.type === 'cards') {
				return { ...s, data: { ...s.data, cards: s.data.cards.filter(c => c.id !== cardId) } };
			}
			return s;
		});
	}

	function addFaqItem(sectionId) {
		sections = sections.map(s => {
			if (s.id === sectionId && s.type === 'faq') {
				return { ...s, data: { ...s.data, items: [...s.data.items, { id: genId(), question: 'New question?', answer: 'Answer here.' }] } };
			}
			return s;
		});
	}

	function removeFaqItem(sectionId, itemId) {
		sections = sections.map(s => {
			if (s.id === sectionId && s.type === 'faq') {
				return { ...s, data: { ...s.data, items: s.data.items.filter(i => i.id !== itemId) } };
			}
			return s;
		});
	}

	function getSectionLabel(type) {
		return sectionTypes.find(s => s.type === type)?.label || type;
	}
	function getSectionIcon(type) {
		return sectionTypes.find(s => s.type === type)?.icon || FileText;
	}

	function updateSectionData(sectionId, patch) {
		sections = sections.map(s => s.id === sectionId ? { ...s, data: { ...s.data, ...patch } } : s);
	}

	function addItem(sectionId, key, item) {
		sections = sections.map(s => s.id === sectionId
			? { ...s, data: { ...s.data, [key]: [...(s.data[key] || []), { id: genId(), ...item }] } }
			: s);
	}

	function removeItem(sectionId, key, itemId) {
		sections = sections.map(s => s.id === sectionId
			? { ...s, data: { ...s.data, [key]: (s.data[key] || []).filter(item => item.id !== itemId) } }
			: s);
	}

	// ---- Rich Text Editor helpers ----
	function execCmd(command, value = null) {
		document.execCommand(command, false, value);
	}

	function insertLink() {
		const url = prompt('Enter URL:');
		if (url) execCmd('createLink', url);
	}

	function insertImage() {
		const url = prompt('Enter image URL:');
		if (url) execCmd('insertImage', url);
	}

	function syncRichText(sectionId) {
		const el = document.getElementById('rte-' + sectionId);
		if (!el) return;
		sections = sections.map(s => {
			if (s.id === sectionId) return { ...s, data: { ...s.data, content: el.innerHTML } };
			return s;
		});
	}
</script>

<SeoHead title="Edit: {page.title}" noindex={true} />

<!-- Toast -->
{#if toast}
	<div class="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
		{toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'}">
		{#if toast.type === 'success'}<CheckCircle2 size={16} />{:else}<AlertCircle size={16} />{/if}
		{toast.msg}
	</div>
{/if}

<div class="p-6 lg:p-8 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8 flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<a href="/admin/pages" class="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white transition-colors">
				<ArrowLeft size={20} />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-white flex items-center gap-2">
					<FileText size={22} class="text-accent-400" />
					Edit Page
				</h1>
				<p class="text-surface-400 text-sm mt-0.5">/pages/{page.slug}</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if page.is_published}
				<a href="/pages/{page.slug}" target="_blank"
					class="flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-700 text-surface-300 hover:text-white hover:border-surface-500 text-sm font-medium transition-colors">
					<Eye size={15} /> Preview
				</a>
			{/if}

			<form method="POST" action={page.is_published ? '?/unpublish' : '?/publish'} use:enhance={() => {
				publishing = true;
				return async ({ update }) => { await update(); publishing = false; };
			}}>
				<button type="submit" disabled={publishing}
					class="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors
						{page.is_published ? 'border-surface-700 text-surface-300 hover:bg-surface-800' : 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'}">
					{#if page.is_published}<EyeOff size={15} /> Unpublish{:else}<Globe size={15} /> Publish{/if}
				</button>
			</form>

			<form method="POST" action="?/delete" use:enhance={() => {
				if (!confirm('Delete this page permanently?')) return ({ cancel }) => cancel();
				deleting = true;
				return async ({ update }) => { await update(); };
			}}>
				<button type="submit" disabled={deleting}
					class="p-2 rounded-xl border border-surface-700 text-surface-400 hover:text-rose-400 hover:border-rose-500/50 transition-colors" title="Delete">
					<Trash2 size={16} />
				</button>
			</form>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
		<!-- Main Editor (3 cols) -->
		<form method="POST" action="?/save" use:enhance={() => {
			saving = true;
			return async ({ update }) => { await update(); saving = false; };
		}} class="lg:col-span-3 space-y-5">

			<input type="hidden" name="show_in_menu" value={page.show_in_menu ? 'true' : 'false'} />
			<input type="hidden" name="sections" value={JSON.stringify(sections)} />

			<!-- Title & Slug -->
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-5 space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5" for="page-title">Page Title</label>
						<input id="page-title" type="text" name="title" bind:value={page.title}
							class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500 transition-colors" required />
					</div>
					<div>
						<label class="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5" for="page-slug">URL Slug</label>
						<div class="flex items-center bg-surface-800 border border-surface-700 rounded-xl overflow-hidden focus-within:border-accent-500 transition-colors">
							<span class="pl-3 text-surface-500 text-sm select-none">/pages/</span>
							<input id="page-slug" type="text" name="slug" bind:value={page.slug}
								class="flex-1 px-1 py-2.5 bg-transparent text-white text-sm font-mono focus:outline-none" required />
						</div>
					</div>
				</div>
			</div>

			<!-- Sections Builder -->
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-5">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
						<LayoutGrid size={16} class="text-accent-400" />
						Page Sections
					</h2>
					<span class="text-xs text-surface-500">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
				</div>

				{#if sections.length === 0}
					<div class="border-2 border-dashed border-surface-700 rounded-xl p-10 text-center">
						<LayoutGrid size={40} class="text-surface-600 mx-auto mb-3" />
						<p class="text-surface-400 text-sm mb-1">No sections yet</p>
						<p class="text-surface-500 text-xs mb-4">Add sections to build your page visually</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each sections as section, idx (section.id)}
							{@const SectionIcon = getSectionIcon(section.type)}
							<div class="border border-surface-700 rounded-xl overflow-hidden transition-all
								{activeSection === section.id ? 'border-accent-500/50 ring-1 ring-accent-500/20' : 'hover:border-surface-600'}">

								<!-- Section Header -->
								<div role="button" tabindex="0"
									onclick={() => activeSection = activeSection === section.id ? null : section.id}
									onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeSection = activeSection === section.id ? null : section.id; } }}
									class="w-full flex items-center gap-3 px-4 py-3 bg-surface-800/50 text-left group cursor-pointer">
									<SectionIcon size={18} class="text-accent-400 shrink-0" />
									<div class="flex-1 min-w-0">
										<span class="text-sm font-medium text-white">{getSectionLabel(section.type)}</span>
										{#if section.type === 'hero'}
											<span class="text-xs text-surface-500 ml-2 truncate">— {section.data.title}</span>
										{/if}
									</div>
									<div role="presentation" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onclick={(e) => e.stopPropagation()}>
										<button type="button" onclick={() => moveSection(section.id, -1)} disabled={idx === 0}
											class="p-1 rounded text-surface-500 hover:text-white disabled:opacity-30"><ChevronUp size={14} /></button>
										<button type="button" onclick={() => moveSection(section.id, 1)} disabled={idx === sections.length - 1}
											class="p-1 rounded text-surface-500 hover:text-white disabled:opacity-30"><ChevronDown size={14} /></button>
										<button type="button" onclick={() => duplicateSection(section.id)}
											class="p-1 rounded text-surface-500 hover:text-accent-400"><Copy size={13} /></button>
										<button type="button" onclick={() => removeSection(section.id)}
											class="p-1 rounded text-surface-500 hover:text-rose-400"><X size={14} /></button>
									</div>
								</div>

								<!-- Section Editor (expanded) -->
								{#if activeSection === section.id}
									<div class="px-4 py-4 space-y-3 border-t border-surface-700/50 bg-surface-850">

										{#if section.type === 'hero'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Heading</span>
												<input type="text" bind:value={section.data.title}
													class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
											</div>
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Subtitle</span>
												<textarea bind:value={section.data.subtitle} rows="2"
													class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500 resize-none"></textarea>
											</div>
											<div class="flex gap-3">
												<div class="flex-1">
													<span class="block text-xs font-medium text-surface-400 mb-1">Alignment</span>
													<select bind:value={section.data.alignment}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none">
														<option value="left">Left</option>
														<option value="center">Center</option>
														<option value="right">Right</option>
													</select>
												</div>
												<div class="flex-1">
													<span class="block text-xs font-medium text-surface-400 mb-1">Size</span>
													<select bind:value={section.data.size}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none">
														<option value="small">Small</option>
														<option value="medium">Medium</option>
														<option value="large">Large</option>
													</select>
												</div>
											</div>
											<div class="grid grid-cols-2 gap-3">
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Primary Button</span>
													<input type="text" bind:value={section.data.primaryText}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Primary URL</span>
													<input type="text" bind:value={section.data.primaryUrl}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm font-mono focus:outline-none focus:border-accent-500" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Secondary Button</span>
													<input type="text" bind:value={section.data.secondaryText}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Secondary URL</span>
													<input type="text" bind:value={section.data.secondaryUrl}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm font-mono focus:outline-none focus:border-accent-500" />
												</div>
											</div>

										{:else if section.type === 'rich_text'}
											<div>
												<!-- Toolbar -->
												<div class="flex flex-wrap items-center gap-0.5 p-1.5 bg-surface-800 border border-surface-700 rounded-t-lg">
													<!-- Text style -->
													<button type="button" onclick={() => execCmd('bold')} title="Bold" class="rte-btn"><b>B</b></button>
													<button type="button" onclick={() => execCmd('italic')} title="Italic" class="rte-btn"><i>I</i></button>
													<button type="button" onclick={() => execCmd('underline')} title="Underline" class="rte-btn"><u>U</u></button>
													<button type="button" onclick={() => execCmd('strikeThrough')} title="Strikethrough" class="rte-btn"><s>S</s></button>
													<span class="w-px h-5 bg-surface-600 mx-1"></span>

													<!-- Headings -->
													<button type="button" onclick={() => execCmd('formatBlock', 'h2')} title="Heading 2" class="rte-btn text-xs font-bold">H2</button>
													<button type="button" onclick={() => execCmd('formatBlock', 'h3')} title="Heading 3" class="rte-btn text-xs font-bold">H3</button>
													<button type="button" onclick={() => execCmd('formatBlock', 'h4')} title="Heading 4" class="rte-btn text-xs font-bold">H4</button>
													<button type="button" onclick={() => execCmd('formatBlock', 'p')} title="Paragraph" class="rte-btn text-xs">¶</button>
													<span class="w-px h-5 bg-surface-600 mx-1"></span>

													<!-- Lists -->
													<button type="button" onclick={() => execCmd('insertUnorderedList')} title="Bullet List" class="rte-btn">•≡</button>
													<button type="button" onclick={() => execCmd('insertOrderedList')} title="Numbered List" class="rte-btn">1.</button>
													<span class="w-px h-5 bg-surface-600 mx-1"></span>

													<!-- Alignment -->
													<button type="button" onclick={() => execCmd('justifyLeft')} title="Align Left" class="rte-btn">⫷</button>
													<button type="button" onclick={() => execCmd('justifyCenter')} title="Align Center" class="rte-btn">☰</button>
													<button type="button" onclick={() => execCmd('justifyRight')} title="Align Right" class="rte-btn">⫸</button>
													<span class="w-px h-5 bg-surface-600 mx-1"></span>
													<button type="button" onclick={() => execCmd('foreColor', '#22d3ee')} title="Accent Color" class="rte-btn text-accent-400">A</button>
													<button type="button" onclick={() => execCmd('hiliteColor', '#334155')} title="Highlight" class="rte-btn">▣</button>
													<span class="w-px h-5 bg-surface-600 mx-1"></span>

													<!-- Extras -->
													<button type="button" onclick={() => insertLink()} title="Insert Link" class="rte-btn">🔗</button>
													<button type="button" onclick={() => insertImage()} title="Insert Image" class="rte-btn">▧</button>
													<button type="button" onclick={() => execCmd('formatBlock', 'blockquote')} title="Quote" class="rte-btn">❝</button>
													<button type="button" onclick={() => execCmd('insertHorizontalRule')} title="Horizontal Rule" class="rte-btn">―</button>
													<button type="button" onclick={() => execCmd('removeFormat')} title="Clear Formatting" class="rte-btn text-rose-400">✕</button>
												</div>

												<!-- Editable area -->
												<div
													id={`rte-${section.id}`}
													contenteditable="true"
													oninput={() => syncRichText(section.id)}
													class="w-full min-h-[200px] max-h-[500px] overflow-y-auto px-4 py-3 bg-surface-800 border border-t-0 border-surface-700 rounded-b-lg text-white text-sm focus:outline-none focus:border-accent-500 prose prose-sm prose-invert max-w-none
														prose-headings:text-white prose-p:text-surface-300 prose-a:text-accent-400 prose-strong:text-white prose-blockquote:border-accent-500 prose-blockquote:text-surface-400
														prose-ul:text-surface-300 prose-ol:text-surface-300 prose-code:text-accent-300 prose-code:bg-surface-700 prose-code:px-1 prose-code:rounded
														prose-hr:border-surface-600"
												>{@html sanitizeHtml(section.data.content)}</div>
											</div>

										{:else if section.type === 'media_text'}
											<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Eyebrow</span>
													<input type="text" bind:value={section.data.eyebrow} class="admin-input" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Media Position</span>
													<select bind:value={section.data.mediaPosition} class="admin-input">
														<option value="left">Image Left</option>
														<option value="right">Image Right</option>
													</select>
												</div>
											</div>
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Title</span>
												<input type="text" bind:value={section.data.title} class="admin-input" />
											</div>
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Text</span>
												<textarea bind:value={section.data.text} rows="4" class="admin-textarea"></textarea>
											</div>
											<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Image URL</span>
													<input type="url" bind:value={section.data.imageUrl} class="admin-input" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Image Alt</span>
													<input type="text" bind:value={section.data.imageAlt} class="admin-input" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Button Text</span>
													<input type="text" bind:value={section.data.buttonText} class="admin-input" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Button URL</span>
													<input type="text" bind:value={section.data.buttonUrl} class="admin-input" />
												</div>
											</div>

										{:else if section.type === 'cards'}
											<div class="flex gap-3 mb-2">
												<div class="flex-1">
													<span class="block text-xs font-medium text-surface-400 mb-1">Columns</span>
													<select bind:value={section.data.columns}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none">
														<option value={2}>2 Columns</option>
														<option value={3}>3 Columns</option>
														<option value={4}>4 Columns</option>
													</select>
												</div>
												<div class="flex-1">
													<span class="block text-xs font-medium text-surface-400 mb-1">Style</span>
													<select bind:value={section.data.style}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none">
														<option value="default">Default</option>
														<option value="bordered">Bordered</option>
														<option value="gradient">Gradient</option>
													</select>
												</div>
											</div>
											<div class="space-y-2">
												{#each section.data.cards as card (card.id)}
													<div class="bg-surface-800 rounded-lg p-3 space-y-2 relative group/card">
														<button type="button" onclick={() => removeCard(section.id, card.id)}
															class="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-rose-400 opacity-0 group-hover/card:opacity-100 transition-opacity">
															<X size={13} />
														</button>
														<div class="flex gap-2">
															<div class="w-16">
																<span class="block text-xs text-surface-500 mb-1">Icon</span>
																<input type="text" bind:value={card.icon} maxlength="2"
																	class="w-full px-2 py-1.5 rounded bg-surface-700 border border-surface-600 text-center text-lg focus:outline-none focus:border-accent-500" />
															</div>
															<div class="flex-1">
																<span class="block text-xs text-surface-500 mb-1">Title</span>
																<input type="text" bind:value={card.title}
																	class="w-full px-2 py-1.5 rounded bg-surface-700 border border-surface-600 text-white text-sm focus:outline-none focus:border-accent-500" />
															</div>
														</div>
														<div>
															<span class="block text-xs text-surface-500 mb-1">Description</span>
															<textarea bind:value={card.description} rows="2"
																class="w-full px-2 py-1.5 rounded bg-surface-700 border border-surface-600 text-white text-sm resize-none focus:outline-none focus:border-accent-500"></textarea>
														</div>
													</div>
												{/each}
											</div>
											<button type="button" onclick={() => addCard(section.id)}
												class="w-full py-2 rounded-lg border border-dashed border-surface-600 text-surface-400 hover:text-accent-400 hover:border-accent-500 text-sm transition-colors flex items-center justify-center gap-1.5">
												<Plus size={14} /> Add Card
											</button>

										{:else if section.type === 'stats'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Section Title</span>
												<input type="text" bind:value={section.data.title} class="admin-input" />
											</div>
											<div class="space-y-2">
												{#each section.data.items as item (item.id)}
													<div class="bg-surface-800 rounded-lg p-3 space-y-2 relative group/item">
														<button type="button" onclick={() => removeItem(section.id, 'items', item.id)} class="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={13} /></button>
														<div class="grid grid-cols-1 md:grid-cols-3 gap-2">
															<input type="text" bind:value={item.value} placeholder="100+" class="admin-input" />
															<input type="text" bind:value={item.label} placeholder="Label" class="admin-input" />
															<input type="text" bind:value={item.description} placeholder="Description" class="admin-input" />
														</div>
													</div>
												{/each}
											</div>
											<button type="button" onclick={() => addItem(section.id, 'items', { value: '10+', label: 'Metric', description: 'Short detail' })} class="add-row-btn"><Plus size={14} /> Add Stat</button>

										{:else if section.type === 'features' || section.type === 'steps'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Section Title</span>
												<input type="text" bind:value={section.data.title} class="admin-input" />
											</div>
											{#if section.type === 'features'}
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Intro</span>
													<textarea bind:value={section.data.intro} rows="2" class="admin-textarea"></textarea>
												</div>
											{/if}
											<div class="space-y-2">
												{#each section.data.items as item (item.id)}
													<div class="bg-surface-800 rounded-lg p-3 space-y-2 relative group/item">
														<button type="button" onclick={() => removeItem(section.id, 'items', item.id)} class="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={13} /></button>
														<input type="text" bind:value={item.title} placeholder="Title" class="admin-input" />
														<textarea bind:value={item.description} rows="2" placeholder="Description" class="admin-textarea"></textarea>
													</div>
												{/each}
											</div>
											<button type="button" onclick={() => addItem(section.id, 'items', { title: 'New item', description: 'Description' })} class="add-row-btn"><Plus size={14} /> Add Item</button>

										{:else if section.type === 'testimonials'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Section Title</span>
												<input type="text" bind:value={section.data.title} class="admin-input" />
											</div>
											<div class="space-y-2">
												{#each section.data.items as item (item.id)}
													<div class="bg-surface-800 rounded-lg p-3 space-y-2 relative group/item">
														<button type="button" onclick={() => removeItem(section.id, 'items', item.id)} class="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={13} /></button>
														<textarea bind:value={item.quote} rows="3" placeholder="Quote" class="admin-textarea"></textarea>
														<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
															<input type="text" bind:value={item.name} placeholder="Name" class="admin-input" />
															<input type="text" bind:value={item.role} placeholder="Role or company" class="admin-input" />
														</div>
													</div>
												{/each}
											</div>
											<button type="button" onclick={() => addItem(section.id, 'items', { quote: 'A short testimonial goes here.', name: 'Name', role: 'Role' })} class="add-row-btn"><Plus size={14} /> Add Testimonial</button>

										{:else if section.type === 'pricing'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Section Title</span>
												<input type="text" bind:value={section.data.title} class="admin-input" />
											</div>
											<div class="space-y-2">
												{#each section.data.items as item (item.id)}
													<div class="bg-surface-800 rounded-lg p-3 space-y-2 relative group/item">
														<button type="button" onclick={() => removeItem(section.id, 'items', item.id)} class="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={13} /></button>
														<div class="grid grid-cols-1 md:grid-cols-3 gap-2">
															<input type="text" bind:value={item.name} placeholder="Plan name" class="admin-input" />
															<input type="text" bind:value={item.price} placeholder="$49" class="admin-input" />
															<input type="text" bind:value={item.description} placeholder="Short description" class="admin-input" />
														</div>
														<textarea bind:value={item.features} rows="4" placeholder="One feature per line" class="admin-textarea"></textarea>
														<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
															<input type="text" bind:value={item.buttonText} placeholder="Button text" class="admin-input" />
															<input type="text" bind:value={item.buttonUrl} placeholder="Button URL" class="admin-input" />
														</div>
													</div>
												{/each}
											</div>
											<button type="button" onclick={() => addItem(section.id, 'items', { name: 'New Plan', price: '$99', description: 'Plan description', features: 'Feature one\nFeature two', buttonText: 'Choose Plan', buttonUrl: '/' })} class="add-row-btn"><Plus size={14} /> Add Plan</button>

										{:else if section.type === 'gallery'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Columns</span>
												<select bind:value={section.data.columns} class="admin-input">
													<option value={2}>2 Columns</option>
													<option value={3}>3 Columns</option>
													<option value={4}>4 Columns</option>
												</select>
											</div>
											<div class="space-y-2">
												{#each section.data.images as image (image.id)}
													<div class="bg-surface-800 rounded-lg p-3 space-y-2 relative group/item">
														<button type="button" onclick={() => removeItem(section.id, 'images', image.id)} class="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={13} /></button>
														<input type="url" bind:value={image.url} placeholder="Image URL" class="admin-input" />
														<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
															<input type="text" bind:value={image.alt} placeholder="Alt text" class="admin-input" />
															<input type="text" bind:value={image.caption} placeholder="Caption" class="admin-input" />
														</div>
													</div>
												{/each}
											</div>
											<button type="button" onclick={() => addItem(section.id, 'images', { url: '', alt: '', caption: 'Caption' })} class="add-row-btn"><Plus size={14} /> Add Image</button>

										{:else if section.type === 'contact'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Title</span>
												<input type="text" bind:value={section.data.title} class="admin-input" />
											</div>
											<textarea bind:value={section.data.description} rows="3" class="admin-textarea"></textarea>
											<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
												<input type="email" bind:value={section.data.email} placeholder="Email" class="admin-input" />
												<input type="text" bind:value={section.data.phone} placeholder="Phone" class="admin-input" />
												<input type="text" bind:value={section.data.address} placeholder="Address" class="admin-input" />
												<input type="text" bind:value={section.data.buttonText} placeholder="Button Text" class="admin-input" />
												<input type="text" bind:value={section.data.buttonUrl} placeholder="Button URL" class="admin-input md:col-span-2" />
											</div>

										{:else if section.type === 'embed'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Title</span>
												<input type="text" bind:value={section.data.title} class="admin-input" />
											</div>
											<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
												<div class="md:col-span-2">
													<span class="block text-xs font-medium text-surface-400 mb-1">Embed URL</span>
													<input type="url" bind:value={section.data.embedUrl} placeholder="https://www.youtube.com/embed/..." class="admin-input" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Aspect</span>
													<select bind:value={section.data.aspect} class="admin-input">
														<option value="video">Video</option>
														<option value="map">Map/Wide</option>
														<option value="square">Square</option>
													</select>
												</div>
											</div>
											<input type="text" bind:value={section.data.caption} placeholder="Caption" class="admin-input" />

										{:else if section.type === 'faq'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Section Title</span>
												<input type="text" bind:value={section.data.title}
													class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
											</div>
											<div class="space-y-2">
												{#each section.data.items as item (item.id)}
													<div class="bg-surface-800 rounded-lg p-3 space-y-2 relative group/faq">
														<button type="button" onclick={() => removeFaqItem(section.id, item.id)}
															class="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-rose-400 opacity-0 group-hover/faq:opacity-100 transition-opacity">
															<X size={13} />
														</button>
														<div>
															<span class="block text-xs text-surface-500 mb-1">Question</span>
															<input type="text" bind:value={item.question}
																class="w-full px-2 py-1.5 rounded bg-surface-700 border border-surface-600 text-white text-sm focus:outline-none focus:border-accent-500" />
														</div>
														<div>
															<span class="block text-xs text-surface-500 mb-1">Answer</span>
															<textarea bind:value={item.answer} rows="3"
																class="w-full px-2 py-1.5 rounded bg-surface-700 border border-surface-600 text-white text-sm resize-none focus:outline-none focus:border-accent-500"></textarea>
														</div>
													</div>
												{/each}
											</div>
											<button type="button" onclick={() => addFaqItem(section.id)}
												class="w-full py-2 rounded-lg border border-dashed border-surface-600 text-surface-400 hover:text-accent-400 hover:border-accent-500 text-sm transition-colors flex items-center justify-center gap-1.5">
												<Plus size={14} /> Add Question
											</button>

										{:else if section.type === 'cta'}
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Heading</span>
												<input type="text" bind:value={section.data.title}
													class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
											</div>
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Description</span>
												<textarea bind:value={section.data.description} rows="2"
													class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500 resize-none"></textarea>
											</div>
											<div class="grid grid-cols-2 gap-3">
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Button Text</span>
													<input type="text" bind:value={section.data.buttonText}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500" />
												</div>
												<div>
													<span class="block text-xs font-medium text-surface-400 mb-1">Button URL</span>
													<input type="text" bind:value={section.data.buttonUrl}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm font-mono focus:outline-none focus:border-accent-500" />
												</div>
											</div>
											<div>
												<span class="block text-xs font-medium text-surface-400 mb-1">Style</span>
												<select bind:value={section.data.style}
													class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none">
													<option value="gradient">Gradient</option>
													<option value="outlined">Outlined</option>
													<option value="solid">Solid</option>
												</select>
											</div>

										{:else if section.type === 'divider'}
											<div class="flex gap-3">
												<div class="flex-1">
													<span class="block text-xs font-medium text-surface-400 mb-1">Style</span>
													<select bind:value={section.data.style}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none">
														<option value="line">Line</option>
														<option value="dots">Dots</option>
														<option value="gradient">Gradient</option>
														<option value="space">Space Only</option>
													</select>
												</div>
												<div class="flex-1">
													<span class="block text-xs font-medium text-surface-400 mb-1">Spacing</span>
													<select bind:value={section.data.spacing}
														class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none">
														<option value="small">Small</option>
														<option value="medium">Medium</option>
														<option value="large">Large</option>
													</select>
												</div>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Add Section Button -->
				<div class="mt-4 relative">
					<button type="button" onclick={() => showAddMenu = !showAddMenu}
						class="w-full py-3 rounded-xl border-2 border-dashed border-surface-700 text-surface-400 hover:text-accent-400 hover:border-accent-500/50 text-sm font-medium transition-all flex items-center justify-center gap-2">
						<Plus size={16} /> Add Section
					</button>

					{#if showAddMenu}
						<div class="absolute bottom-full left-0 right-0 mb-2 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl shadow-black/40 p-2 z-20 grid grid-cols-2 gap-1.5">
							{#each sectionTypes as st}
								{@const AddIcon = st.icon}
								<button type="button" onclick={() => addSection(st.type)}
									class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-700 text-left transition-colors group/add">
									<AddIcon size={18} class="text-accent-400 shrink-0" />
									<div>
										<p class="text-sm font-medium text-white group-hover/add:text-accent-400 transition-colors">{st.label}</p>
										<p class="text-xs text-surface-500">{st.description}</p>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- SEO -->
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-5 space-y-4">
				<h2 class="text-xs font-semibold text-surface-400 uppercase tracking-wider">SEO</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-xs font-medium text-surface-400 mb-1" for="meta-title">Meta Title</label>
						<input id="meta-title" type="text" name="meta_title" bind:value={page.meta_title} placeholder="Uses page title if blank"
							class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500 transition-colors" />
					</div>
					<div>
						<label class="block text-xs font-medium text-surface-400 mb-1" for="meta-desc">Meta Description</label>
						<input id="meta-desc" type="text" name="meta_description" bind:value={page.meta_description} placeholder="150-160 chars recommended"
							class="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500 transition-colors" />
					</div>
				</div>
			</div>

			<!-- Save -->
			<div class="flex justify-end">
				<button type="submit" disabled={saving}
					class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors">
					<Save size={16} />
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>

		<!-- Sidebar -->
		<div class="space-y-4">
			<!-- Status -->
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-4">
				<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Status</h3>
				<div class="flex items-center gap-2.5">
					<div class="w-2.5 h-2.5 rounded-full {page.is_published ? 'bg-emerald-400' : 'bg-surface-600'}"></div>
					<span class="text-sm font-medium {page.is_published ? 'text-emerald-400' : 'text-surface-400'}">
						{page.is_published ? 'Published' : 'Draft'}
					</span>
				</div>
				{#if page.is_published && page.published_at}
					<p class="text-xs text-surface-500 mt-1.5">
						{new Date(page.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
					</p>
				{/if}
			</div>

			<!-- Visibility -->
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-4">
				<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Visibility</h3>
				<label class="flex items-start gap-3 cursor-pointer">
					<div class="relative mt-0.5">
						<input type="checkbox" bind:checked={page.show_in_menu} class="sr-only peer" />
						<div class="w-9 h-5 rounded-full border-2 transition-colors
							{page.show_in_menu ? 'bg-accent-500 border-accent-500' : 'bg-surface-700 border-surface-600'}
							peer-focus:ring-2 peer-focus:ring-accent-500/30"></div>
						<div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
							{page.show_in_menu ? 'translate-x-4' : 'translate-x-0'}"></div>
					</div>
					<div>
						<p class="text-sm font-medium text-white flex items-center gap-1.5">
							<Navigation size={12} class="text-accent-400" /> Navbar
						</p>
						<p class="text-xs text-surface-500 mt-0.5">Show in navigation</p>
					</div>
				</label>
				<p class="text-xs text-surface-600 mt-3 border-t border-surface-800 pt-2">
					Must be published to appear
				</p>
			</div>

			<!-- Page Info -->
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-4">
				<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Info</h3>
				<dl class="space-y-2 text-xs">
					<div class="flex justify-between">
						<dt class="text-surface-500">Created</dt>
						<dd class="text-surface-300">{new Date(page.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</dd>
					</div>
					{#if page.updated_at}
					<div class="flex justify-between">
						<dt class="text-surface-500">Updated</dt>
						<dd class="text-surface-300">{new Date(page.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</dd>
					</div>
					{/if}
					<div class="flex justify-between">
						<dt class="text-surface-500">URL</dt>
						<dd class="text-accent-400 font-mono truncate max-w-[100px]">/pages/{page.slug}</dd>
					</div>
				</dl>
			</div>
			</div>
	</div>
</div>

<style>
	:global(.rte-btn) {
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		color: rgb(var(--color-surface-300));
		font-size: 0.8rem;
		line-height: 1;
		cursor: pointer;
		transition: all 0.15s;
		border: none;
		background: transparent;
		min-width: 1.75rem;
		text-align: center;
	}
	:global(.rte-btn:hover) {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}
	:global(.rte-btn:active) {
		background: rgba(255, 255, 255, 0.15);
		transform: scale(0.95);
	}
	:global(.admin-input) {
		width: 100%;
		border-radius: 0.5rem;
		border: 1px solid var(--color-surface-700);
		background: var(--color-surface-800);
		padding: 0.5rem 0.75rem;
		color: white;
		font-size: 0.875rem;
	}
	:global(.admin-textarea) {
		width: 100%;
		border-radius: 0.5rem;
		border: 1px solid var(--color-surface-700);
		background: var(--color-surface-800);
		padding: 0.5rem 0.75rem;
		color: white;
		font-size: 0.875rem;
		resize: vertical;
	}
	:global(.admin-input:focus),
	:global(.admin-textarea:focus) {
		outline: none;
		border-color: var(--color-accent-500);
	}
	:global(.add-row-btn) {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		border-radius: 0.5rem;
		border: 1px dashed var(--color-surface-600);
		padding: 0.5rem;
		color: var(--color-surface-400);
		font-size: 0.875rem;
		transition: all 0.15s;
	}
	:global(.add-row-btn:hover) {
		border-color: var(--color-accent-500);
		color: var(--color-accent-400);
	}
	:global([contenteditable]:focus) {
		outline: none;
		border-color: var(--color-accent-500);
	}
	:global([contenteditable] a) {
		color: var(--color-accent-400);
		text-decoration: underline;
	}
</style>
