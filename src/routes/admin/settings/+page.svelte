<script>
	import { invalidateAll } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import {
		Settings,
		Save,
		AlertCircle,
		Check,
		Image as ImageIcon,
		Trash2,
		Pencil,
		Upload,
		Library,
		CheckCircle,
		Copy
	} from '@lucide/svelte';
	import { submitAction } from '$lib/utils/adminFetch.js';
	import { inlineImageUrl } from '$lib/utils/media.js';

	let { data } = $props();

	let settings = $state([]);
	let themeSettings = $state([]);
	let activeCategory = $state('general');
	let saving = $state(false);
	let message = $state({ type: '', text: '' });
	let customPreviewMode = $state('dark');
	let previewSurface = $state('homepage');
	let customThemes = $state([]);
	let selectedCustomThemeId = $state('');
	let customThemeName = $state('');
	let customThemeDescription = $state('');
	let managingTheme = $state(false);

	const categoryLabels = {
		general: 'General',
		branding: 'Branding',
		contact: 'Contact',
		legal: 'Legal',
		analytics: 'Analytics',
		custom: 'Custom Code'
	};

	const builtInThemePresets = [
		{ value: 'default', label: 'Default Dark Cyan' },
		{ value: 'earth', label: 'Earth Green' },
		{ value: 'apple', label: 'Apple Minimal' },
		{ value: 'editorial', label: 'Editorial Magazine' },
		{ value: 'studio', label: 'Warm Studio' },
		{ value: 'midnight', label: 'Midnight Prism' },
		{ value: 'aurora', label: 'Aurora Signal' },
		{ value: 'graphite', label: 'Graphite Pro' },
		{ value: 'custom', label: 'Custom Unsaved' }
	];

	const presetPreviewStyles = {
		default: {
			gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee, #818cf8)',
			background: '#09090b',
			panel: '#18181b',
			heading: '#ffffff',
			text: '#d4d4d8',
			muted: '#a1a1aa'
		},
		earth: {
			gradient: 'linear-gradient(135deg, #10b981, #34d399, #4ade80)',
			background: '#07110b',
			panel: '#14221a',
			heading: '#ffffff',
			text: '#d1fae5',
			muted: '#86efac'
		},
		apple: {
			gradient: 'linear-gradient(135deg, #2563eb, #60a5fa, #a5b4fc)',
			background: '#0c0d10',
			panel: '#16181d',
			heading: '#ffffff',
			text: '#e5e7eb',
			muted: '#9ca3af'
		},
		editorial: {
			gradient: 'linear-gradient(135deg, #be185d, #f472b6, #fb7185)',
			background: '#0c0a09',
			panel: '#1c1917',
			heading: '#fff7ed',
			text: '#e7e5e4',
			muted: '#a8a29e'
		},
		studio: {
			gradient: 'linear-gradient(135deg, #d97706, #fbbf24, #f97316)',
			background: '#0f0c0a',
			panel: '#1c1815',
			heading: '#fff7ed',
			text: '#fed7aa',
			muted: '#d6a87f'
		},
		midnight: {
			gradient: 'linear-gradient(135deg, #4f46e5, #06b6d4, #c084fc)',
			background: '#050816',
			panel: '#111827',
			heading: '#eef2ff',
			text: '#c7d2fe',
			muted: '#818cf8'
		},
		aurora: {
			gradient: 'linear-gradient(135deg, #0f766e, #84cc16, #22d3ee)',
			background: '#04130f',
			panel: '#10231d',
			heading: '#ecfdf5',
			text: '#bbf7d0',
			muted: '#6ee7b7'
		},
		graphite: {
			gradient: 'linear-gradient(135deg, #52525b, #a1a1aa, #f8fafc)',
			background: '#0a0a0a',
			panel: '#18181b',
			heading: '#fafafa',
			text: '#d4d4d8',
			muted: '#a1a1aa'
		},
		custom: {
			gradient: 'linear-gradient(135deg, #0891b2, #06b6d4, #22d3ee)',
			background: '#09090b',
			panel: '#18181b',
			heading: '#ffffff',
			text: '#e4e4e7',
			muted: '#a1a1aa'
		}
	};

	const customThemeFields = [
		{
			title: 'Brand Gradient',
			description: 'Used by primary buttons, highlights, and headline accents.',
			fields: [
				{ key: 'color_primary_hover', label: 'Start', type: 'color' },
				{ key: 'color_primary', label: 'Middle', type: 'color' },
				{ key: 'color_accent', label: 'End', type: 'color' }
			]
		},
		{
			title: 'Surfaces',
			description: 'Controls the page background, panels, and borders.',
			fields: [
				{ key: 'color_bg_primary', label: 'Page', type: 'color' },
				{ key: 'color_bg_secondary', label: 'Panel', type: 'color' },
				{ key: 'color_bg_tertiary', label: 'Border', type: 'color' }
			]
		},
		{
			title: 'Light Mode Surfaces',
			description: 'Used when visitors switch the site to light mode.',
			fields: [
				{ key: 'color_light_bg_primary', label: 'Page', type: 'color', fallback: '#ffffff' },
				{ key: 'color_light_bg_secondary', label: 'Panel', type: 'color', fallback: '#f8fafc' },
				{ key: 'color_light_bg_tertiary', label: 'Border', type: 'color', fallback: '#d1d5db' }
			]
		},
		{
			title: 'Light Mode Text',
			description: 'Keeps contrast readable on light backgrounds.',
			fields: [
				{ key: 'color_light_text_primary', label: 'Primary', type: 'color', fallback: '#0f172a' },
				{ key: 'color_light_text_secondary', label: 'Body', type: 'color', fallback: '#334155' },
				{ key: 'color_light_text_muted', label: 'Muted', type: 'color', fallback: '#64748b' }
			]
		},
		{
			title: 'Text',
			description: 'Sets hierarchy for headings, body copy, and secondary metadata.',
			fields: [
				{ key: 'color_text_primary', label: 'Primary', type: 'color' },
				{ key: 'color_text_secondary', label: 'Body', type: 'color' },
				{ key: 'color_text_muted', label: 'Muted', type: 'color' }
			]
		},
		{
			title: 'Typography',
			description: 'Use installed/self-hosted fonts for best rendering.',
			fields: [
				{ key: 'font_heading', label: 'Heading Font', type: 'text', placeholder: 'Outfit' },
				{ key: 'font_body', label: 'Body Font', type: 'text', placeholder: 'Inter' },
				{ key: 'font_heading_weight', label: 'Heading Weight', type: 'weight' },
				{ key: 'font_body_weight', label: 'Body Weight', type: 'weight' }
			]
		},
		{
			title: 'Shape',
			description: 'Controls the feel of cards, buttons, and compact controls.',
			fields: [
				{ key: 'radius_md', label: 'Controls Radius', type: 'size', placeholder: '8px' },
				{ key: 'radius_lg', label: 'Cards Radius', type: 'size', placeholder: '12px' },
				{ key: 'radius_xl', label: 'Panels Radius', type: 'size', placeholder: '16px' }
			]
		},
		{
			title: 'Feedback Colors',
			description: 'Used for status chips, validation, and operational states.',
			fields: [
				{ key: 'color_success', label: 'Success', type: 'color' },
				{ key: 'color_warning', label: 'Warning', type: 'color' },
				{ key: 'color_error', label: 'Error', type: 'color' }
			]
		},
		{
			title: 'Elevation',
			description: 'Controls shadow depth on menus, cards, and dialogs.',
			fields: [
				{ key: 'shadow_sm', label: 'Small', type: 'text', placeholder: '0 1px 2px rgb(0 0 0 / 0.05)' },
				{ key: 'shadow_md', label: 'Medium', type: 'text', placeholder: '0 4px 6px rgb(0 0 0 / 0.1)' },
				{ key: 'shadow_lg', label: 'Large', type: 'text', placeholder: '0 10px 15px rgb(0 0 0 / 0.1)' }
			]
		}
	];

	const previewSurfaces = [
		{ value: 'homepage', label: 'Homepage' },
		{ value: 'directory', label: 'Directory' },
		{ value: 'article', label: 'Article' },
		{ value: 'admin', label: 'Admin' }
	];

	const categories = $derived(
		[...new Set((data.settings || []).map(s => s.category).filter(c => c && c !== 'social'))]
	);

	$effect(() => {
		settings = structuredClone(data.settings || []);
		themeSettings = structuredClone(data.themeSettings || []);
		customThemes = structuredClone(data.customThemes || []);
		if (categories.length && !categories.includes(activeCategory)) {
			activeCategory = categories[0];
		}
	});

	function getSettingsByCategory(cat) {
		return settings.filter(s =>
			s.category === cat &&
			!['active_custom_theme_id', 'active_custom_theme_name'].includes(s.key)
		);
	}

	function handleInput(id, value) {
		settings = settings.map(s => s.id === id ? { ...s, value } : s);
	}

	function handleThemeInput(key, value) {
		themeSettings = themeSettings.map(s => s.key === key ? { ...s, value } : s);
	}

	function handleJsonValue(id, raw) {
		try {
			const json = JSON.parse(raw);
			settings = settings.map(s => s.id === id ? { ...s, value_json: json } : s);
		} catch {}
	}

	function getSelectOptions(setting) {
		if (setting.key === 'theme_preset') {
			return [
				...builtInThemePresets,
				...customThemes.map(theme => ({ value: `theme:${theme.id}`, label: `Saved: ${theme.name}` }))
			];
		}
		return setting.value_json?.options || [];
	}

	function getThemePresetValue(setting) {
		if (setting.key !== 'theme_preset') return setting.value || 'default';
		const activeId = activeCustomThemeId();
		if (setting.value === 'custom' && activeId) return `theme:${activeId}`;
		return setting.value || 'default';
	}

	function updateSettingByKey(key, value) {
		settings = settings.map(s => s.key === key ? { ...s, value } : s);
	}

	function presetLabel(value) {
		return builtInThemePresets.find(p => p.value === value)?.label || 'Custom Theme';
	}

	function builtInPresetTokens(value) {
		const base = {
			font_heading: 'Outfit',
			font_body: 'Inter',
			font_heading_weight: '700',
			font_body_weight: '400',
			radius_md: '8px',
			radius_lg: '12px',
			radius_xl: '16px',
			color_success: '#10b981',
			color_warning: '#f59e0b',
			color_error: '#ef4444',
			shadow_sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
			shadow_md: '0 8px 24px -18px rgb(0 0 0 / 0.45)',
			shadow_lg: '0 24px 60px -32px rgb(0 0 0 / 0.55)'
		};

		const presets = {
			default: {
				color_primary_hover: '#0891b2',
				color_primary: '#06b6d4',
				color_accent: '#22d3ee',
				color_bg_primary: '#09090b',
				color_bg_secondary: '#18181b',
				color_bg_tertiary: '#3f3f46',
				color_text_primary: '#ffffff',
				color_text_secondary: '#e4e4e7',
				color_text_muted: '#a1a1aa',
				color_light_bg_primary: '#ffffff',
				color_light_bg_secondary: '#f8fafc',
				color_light_bg_tertiary: '#cbd5e1',
				color_light_text_primary: '#0f172a',
				color_light_text_secondary: '#334155',
				color_light_text_muted: '#64748b'
			},
			earth: {
				color_primary_hover: '#059669',
				color_primary: '#10b981',
				color_accent: '#34d399',
				color_bg_primary: '#07110b',
				color_bg_secondary: '#14221a',
				color_bg_tertiary: '#326248',
				color_text_primary: '#ffffff',
				color_text_secondary: '#d1fae5',
				color_text_muted: '#86efac',
				color_light_bg_primary: '#ffffff',
				color_light_bg_secondary: '#f8fcf8',
				color_light_bg_tertiary: '#d5e5d8',
				color_light_text_primary: '#102016',
				color_light_text_secondary: '#326248',
				color_light_text_muted: '#6b8c74'
			},
			apple: {
				color_primary_hover: '#2563eb',
				color_primary: '#3b82f6',
				color_accent: '#60a5fa',
				color_bg_primary: '#0c0d10',
				color_bg_secondary: '#16181d',
				color_bg_tertiary: '#24272d',
				color_text_primary: '#ffffff',
				color_text_secondary: '#e5e7eb',
				color_text_muted: '#9ca3af',
				color_light_bg_primary: '#ffffff',
				color_light_bg_secondary: '#fbfbfd',
				color_light_bg_tertiary: '#d1d5db',
				color_light_text_primary: '#030712',
				color_light_text_secondary: '#374151',
				color_light_text_muted: '#6b7280'
			},
			editorial: {
				color_primary_hover: '#be185d',
				color_primary: '#db2777',
				color_accent: '#f472b6',
				color_bg_primary: '#0c0a09',
				color_bg_secondary: '#1c1917',
				color_bg_tertiary: '#292524',
				color_text_primary: '#fff7ed',
				color_text_secondary: '#e7e5e4',
				color_text_muted: '#a8a29e',
				color_light_bg_primary: '#fffdf8',
				color_light_bg_secondary: '#fbf8f3',
				color_light_bg_tertiary: '#e7e0da',
				color_light_text_primary: '#1c1917',
				color_light_text_secondary: '#57534e',
				color_light_text_muted: '#78716c'
			},
			studio: {
				color_primary_hover: '#d97706',
				color_primary: '#f59e0b',
				color_accent: '#fbbf24',
				color_bg_primary: '#0f0c0a',
				color_bg_secondary: '#1c1815',
				color_bg_tertiary: '#2a2521',
				color_text_primary: '#fff7ed',
				color_text_secondary: '#fed7aa',
				color_text_muted: '#d6a87f',
				color_light_bg_primary: '#fffdf9',
				color_light_bg_secondary: '#fffaf4',
				color_light_bg_tertiary: '#eadfd6',
				color_light_text_primary: '#1f1711',
				color_light_text_secondary: '#6f5140',
				color_light_text_muted: '#896b5b'
			},
			midnight: {
				color_primary_hover: '#4f46e5',
				color_primary: '#06b6d4',
				color_accent: '#c084fc',
				color_bg_primary: '#050816',
				color_bg_secondary: '#111827',
				color_bg_tertiary: '#312e81',
				color_text_primary: '#eef2ff',
				color_text_secondary: '#c7d2fe',
				color_text_muted: '#818cf8',
				color_light_bg_primary: '#f8fafc',
				color_light_bg_secondary: '#eef2ff',
				color_light_bg_tertiary: '#c7d2fe',
				color_light_text_primary: '#111827',
				color_light_text_secondary: '#3730a3',
				color_light_text_muted: '#6366f1'
			},
			aurora: {
				color_primary_hover: '#0f766e',
				color_primary: '#84cc16',
				color_accent: '#22d3ee',
				color_bg_primary: '#04130f',
				color_bg_secondary: '#10231d',
				color_bg_tertiary: '#14532d',
				color_text_primary: '#ecfdf5',
				color_text_secondary: '#bbf7d0',
				color_text_muted: '#6ee7b7',
				color_light_bg_primary: '#fbfef6',
				color_light_bg_secondary: '#f0fdf4',
				color_light_bg_tertiary: '#bbf7d0',
				color_light_text_primary: '#052e16',
				color_light_text_secondary: '#166534',
				color_light_text_muted: '#0f766e'
			},
			graphite: {
				color_primary_hover: '#52525b',
				color_primary: '#a1a1aa',
				color_accent: '#f8fafc',
				color_bg_primary: '#0a0a0a',
				color_bg_secondary: '#18181b',
				color_bg_tertiary: '#3f3f46',
				color_text_primary: '#fafafa',
				color_text_secondary: '#d4d4d8',
				color_text_muted: '#a1a1aa',
				color_light_bg_primary: '#fafafa',
				color_light_bg_secondary: '#f4f4f5',
				color_light_bg_tertiary: '#d4d4d8',
				color_light_text_primary: '#18181b',
				color_light_text_secondary: '#3f3f46',
				color_light_text_muted: '#71717a'
			}
		};

		return { ...base, ...(presets[value] || presets.default) };
	}

	function applyTokensToEditor(tokens = {}) {
		themeSettings = themeSettings.map(setting => ({
			...setting,
			value: tokens[setting.key] ?? setting.value
		}));
	}

	function prepareCustomThemeFromPreset(value) {
		const label = presetLabel(value);
		applyTokensToEditor(builtInPresetTokens(value));
		updateSettingByKey('theme_preset', 'custom');
		updateSettingByKey('active_custom_theme_id', '');
		updateSettingByKey('active_custom_theme_name', '');
		selectedCustomThemeId = '';
		customThemeName = `${label} Adjusted`;
		customThemeDescription = `Adjusted from ${label}.`;
		message = { type: 'success', text: `${label} loaded into the custom editor.` };
	}

	function handleThemePresetChange(setting, value) {
		if (value.startsWith('theme:')) {
			const theme = customThemes.find(t => t.id === value.slice(6));
			if (theme) {
				loadCustomTheme(theme);
				handleInput(setting.id, 'custom');
				updateSettingByKey('active_custom_theme_id', theme.id);
				updateSettingByKey('active_custom_theme_name', theme.name || '');
			}
			return;
		}

		handleInput(setting.id, value);
		if (value !== 'custom') {
			updateSettingByKey('active_custom_theme_id', '');
			updateSettingByKey('active_custom_theme_name', '');
			selectedCustomThemeId = '';
		} else {
			updateSettingByKey('active_custom_theme_id', '');
			updateSettingByKey('active_custom_theme_name', '');
			selectedCustomThemeId = '';
			customThemeName = customThemeName || 'Untitled Custom Theme';
		}
	}

	function getPresetPreview(setting) {
		const tokens = setting?.value === 'custom'
			? themeTokens()
			: builtInPresetTokens(setting?.value || 'default');
		const themeValue = (key, fallback) => tokens[key] || fallback;
		const accent = themeValue('color_accent', '#22d3ee');
		const primary = themeValue('color_primary', '#06b6d4');
		const primaryHover = themeValue('color_primary_hover', '#0891b2');
		const isLight = customPreviewMode === 'light';

		return {
			gradient: `linear-gradient(135deg, ${primaryHover}, ${primary}, ${accent})`,
			background: isLight ? themeValue('color_light_bg_primary', '#ffffff') : themeValue('color_bg_primary', '#09090b'),
			panel: isLight ? themeValue('color_light_bg_secondary', '#f8fafc') : themeValue('color_bg_secondary', '#18181b'),
			border: isLight ? themeValue('color_light_bg_tertiary', '#d1d5db') : themeValue('color_bg_tertiary', '#3f3f46'),
			heading: isLight ? themeValue('color_light_text_primary', '#0f172a') : themeValue('color_text_primary', '#ffffff'),
			text: isLight ? themeValue('color_light_text_secondary', '#334155') : themeValue('color_text_secondary', '#e4e4e7'),
			muted: isLight ? themeValue('color_light_text_muted', '#64748b') : themeValue('color_text_muted', '#a1a1aa'),
			headingFont: themeValue('font_heading', 'Outfit'),
			bodyFont: themeValue('font_body', 'Inter'),
			headingWeight: themeValue('font_heading_weight', '700'),
			bodyWeight: themeValue('font_body_weight', '400'),
			radiusMd: themeValue('radius_md', '8px'),
			radiusLg: themeValue('radius_lg', '12px'),
			radiusXl: themeValue('radius_xl', '16px'),
			success: themeValue('color_success', '#10b981'),
			warning: themeValue('color_warning', '#f59e0b'),
			error: themeValue('color_error', '#ef4444'),
			shadowSm: themeValue('shadow_sm', '0 1px 2px 0 rgb(0 0 0 / 0.05)'),
			shadowMd: themeValue('shadow_md', '0 4px 6px -1px rgb(0 0 0 / 0.1)'),
			shadowLg: themeValue('shadow_lg', '0 10px 15px -3px rgb(0 0 0 / 0.1)')
		};
	}

	function getThemeSetting(key) {
		return themeSettings.find(s => s.key === key);
	}

	function customThemePayload() {
		return themeSettings.filter(s => s.id);
	}

	function themeTokens() {
		return Object.fromEntries(themeSettings.filter(s => s.key).map(s => [s.key, s.value || '']));
	}

	function activeCustomThemeId() {
		return settings.find(s => s.key === 'active_custom_theme_id')?.value || '';
	}

	function loadCustomTheme(theme) {
		if (!theme?.tokens) return;
		selectedCustomThemeId = theme.id;
		customThemeName = theme.name || '';
		customThemeDescription = theme.description || '';
		applyTokensToEditor(theme.tokens);
		updateSettingByKey('theme_preset', 'custom');
		updateSettingByKey('active_custom_theme_id', theme.id);
		updateSettingByKey('active_custom_theme_name', theme.name || '');
		message = { type: 'success', text: `Loaded "${theme.name}" for editing.` };
	}

	function duplicateCustomTheme(theme) {
		loadCustomTheme(theme);
		selectedCustomThemeId = '';
		customThemeName = `${theme.name || 'Custom theme'} Copy`;
	}

	function clearCustomThemeForm() {
		selectedCustomThemeId = '';
		customThemeName = '';
		customThemeDescription = '';
	}

	async function saveNamedTheme(applyNow = false) {
		managingTheme = true;
		message = { type: '', text: '' };
		try {
			const formData = new FormData();
			formData.append('id', selectedCustomThemeId);
			formData.append('name', customThemeName);
			formData.append('description', customThemeDescription);
			formData.append('tokens', JSON.stringify(themeTokens()));
			formData.append('applyNow', applyNow ? 'true' : 'false');
			await submitAction('saveCustomTheme', formData, '/admin/settings');
			message = { type: 'success', text: applyNow ? 'Custom theme saved and applied.' : 'Custom theme saved.' };
			await invalidateAll();
		} catch (err) {
			message = { type: 'error', text: err.message || 'Failed to save custom theme.' };
		}
		managingTheme = false;
	}

	async function applyNamedTheme(theme) {
		managingTheme = true;
		message = { type: '', text: '' };
		try {
			const formData = new FormData();
			formData.append('id', theme.id);
			await submitAction('applyCustomTheme', formData, '/admin/settings');
			message = { type: 'success', text: `"${theme.name}" applied to the site.` };
			await invalidateAll();
		} catch (err) {
			message = { type: 'error', text: err.message || 'Failed to apply custom theme.' };
		}
		managingTheme = false;
	}

	async function deleteNamedTheme(theme) {
		if (!confirm(`Delete "${theme.name}"? This cannot be undone.`)) return;

		managingTheme = true;
		message = { type: '', text: '' };
		try {
			const formData = new FormData();
			formData.append('id', theme.id);
			formData.append('activeId', activeCustomThemeId());
			await submitAction('deleteCustomTheme', formData, '/admin/settings');
			if (selectedCustomThemeId === theme.id) clearCustomThemeForm();
			message = { type: 'success', text: `"${theme.name}" deleted.` };
			await invalidateAll();
		} catch (err) {
			message = { type: 'error', text: err.message || 'Failed to delete custom theme.' };
		}
		managingTheme = false;
	}

	async function saveSettings() {
		saving = true;
		message = { type: '', text: '' };
		try {
			const formData = new FormData();
			formData.append('settings', JSON.stringify(settings));
			formData.append('themeSettings', JSON.stringify(customThemePayload()));
			await submitAction('update', formData, '/admin/settings');
			message = { type: 'success', text: 'Settings saved successfully!' };
			await invalidateAll();
		} catch (err) {
			message = { type: 'error', text: err.message || 'Failed to save settings.' };
		}
		saving = false;
	}
</script>

<SeoHead title="Site Settings" noindex={true} />

<div class="p-6 lg:p-8">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-3">
				<Settings size={24} class="text-accent-400" />
				Site Settings
			</h1>
			<p class="text-surface-400 mt-1">Configure global website settings</p>
		</div>
		<button
			onclick={saveSettings}
			disabled={saving}
			class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm transition-colors"
		>
			<Save size={16} />
			{saving ? 'Saving...' : 'Save Changes'}
		</button>
	</div>

	{#if message.text}
		<div class="mb-6 p-4 rounded-xl flex items-center gap-3 {message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}">
			{#if message.type === 'success'}<Check size={18} />{:else}<AlertCircle size={18} />{/if}
			{message.text}
		</div>
	{/if}

	<div class="flex flex-col lg:flex-row gap-6">
		<div class="lg:w-56 shrink-0">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-2">
				{#each categories as cat}
					<button
						type="button"
						onclick={() => activeCategory = cat}
						class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all {activeCategory === cat ? 'bg-surface-800 text-white' : 'text-surface-400 hover:text-white'}"
					>
						{categoryLabels[cat] || cat}
					</button>
				{/each}
			</div>
		</div>

		<div class="flex-1">
			<div class="bg-surface-900 border border-surface-800 rounded-2xl p-6">
				<h2 class="text-lg font-semibold text-white mb-6">{categoryLabels[activeCategory] || activeCategory}</h2>

				<div class="space-y-6">
					{#each getSettingsByCategory(activeCategory) as setting}
						<div>
							<label for={`site-setting-${setting.id}`} class="block text-sm font-medium text-surface-300 mb-2">
								{setting.display_name}
							</label>
							{#if setting.description}
								<p class="text-xs text-surface-500 mb-2">{setting.description}</p>
							{/if}

							{#if setting.key === 'theme_preset' || setting.input_type === 'select'}
								<select
									id={`site-setting-${setting.id}`}
									value={getThemePresetValue(setting)}
									onchange={(e) => setting.key === 'theme_preset' ? handleThemePresetChange(setting, e.currentTarget.value) : handleInput(setting.id, e.currentTarget.value)}
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500"
								>
									{#each getSelectOptions(setting) as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
								{#if setting.key === 'theme_preset'}
									{@const preview = getPresetPreview(setting)}
									{#if setting.value !== 'custom'}
										<div class="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-surface-700 bg-surface-950/40 p-3">
											<div class="min-w-0 flex-1">
												<p class="text-sm font-medium text-white">Adjust this preset</p>
												<p class="mt-0.5 text-xs text-surface-500">Load {presetLabel(setting.value || 'default')} into the custom editor, then save it as a named theme.</p>
											</div>
											<button
												type="button"
												onclick={() => prepareCustomThemeFromPreset(setting.value || 'default')}
												class="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-600"
											>
												<Pencil size={15} />
												Adjust preset
											</button>
										</div>
									{/if}
									{#if setting.value === 'custom'}
										<div class="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
											<section class="rounded-xl border border-surface-700 bg-surface-950/50 p-4">
												<div class="mb-4 flex items-start gap-3">
													<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
														<Library size={18} />
													</div>
													<div>
														<h3 class="text-sm font-semibold text-white">Saved custom themes</h3>
														<p class="mt-1 text-xs text-surface-500">Name, reuse, edit, apply, duplicate, or remove complete theme token sets.</p>
													</div>
												</div>

												<div class="space-y-3">
													<div>
														<label for="custom-theme-name" class="mb-1.5 block text-xs font-medium text-surface-400">Theme name</label>
														<input
															id="custom-theme-name"
															type="text"
															value={customThemeName}
															placeholder="e.g. Mematiane Neon Dark"
															oninput={(e) => customThemeName = e.currentTarget.value}
															class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-accent-500 focus:outline-none"
														/>
													</div>
													<div>
														<label for="custom-theme-description" class="mb-1.5 block text-xs font-medium text-surface-400">Description</label>
														<textarea
															id="custom-theme-description"
															value={customThemeDescription}
															placeholder="Where this theme should be used, mood, campaign, or notes."
															rows="3"
															oninput={(e) => customThemeDescription = e.currentTarget.value}
															class="w-full resize-none rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-accent-500 focus:outline-none"
														></textarea>
													</div>
													<div class="flex flex-wrap gap-2">
														<button
															type="button"
															onclick={() => saveNamedTheme(false)}
															disabled={managingTheme || !customThemeName.trim()}
															class="inline-flex items-center gap-2 rounded-lg bg-surface-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-surface-700 disabled:opacity-50"
														>
															<Save size={15} />
															{selectedCustomThemeId ? 'Update theme' : 'Save theme'}
														</button>
														<button
															type="button"
															onclick={() => saveNamedTheme(true)}
															disabled={managingTheme || !customThemeName.trim()}
															class="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
														>
															<CheckCircle size={15} />
															Save and apply
														</button>
														<button
															type="button"
															onclick={clearCustomThemeForm}
															class="inline-flex items-center rounded-lg border border-surface-700 px-3 py-2 text-sm font-medium text-surface-300 transition-colors hover:text-white"
														>
															New
														</button>
													</div>
												</div>
											</section>

											<section class="rounded-xl border border-surface-700 bg-surface-950/50 p-4">
												<div class="mb-3 flex items-center justify-between gap-3">
													<div>
														<h3 class="text-sm font-semibold text-white">Theme library</h3>
														<p class="mt-1 text-xs text-surface-500">{customThemes.length} saved theme{customThemes.length === 1 ? '' : 's'}</p>
													</div>
													{#if activeCustomThemeId()}
														<span class="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">Active theme saved</span>
													{/if}
												</div>

												<div class="max-h-[360px] space-y-3 overflow-y-auto pr-1">
													{#each customThemes as theme}
														{@const isActiveTheme = activeCustomThemeId() === theme.id}
														<div class="rounded-lg border border-surface-700 bg-surface-900 p-3">
															<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
																<div class="min-w-0">
																	<div class="flex flex-wrap items-center gap-2">
																		<p class="truncate text-sm font-semibold text-white">{theme.name}</p>
																		{#if isActiveTheme}
																			<span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">Active</span>
																		{/if}
																	</div>
																	{#if theme.description}
																		<p class="mt-1 line-clamp-2 text-xs text-surface-500">{theme.description}</p>
																	{/if}
																	<div class="mt-3 flex gap-1.5">
																		<span class="h-5 w-8 rounded" style={`background: linear-gradient(135deg, ${theme.tokens?.color_primary_hover || '#0891b2'}, ${theme.tokens?.color_primary || '#06b6d4'}, ${theme.tokens?.color_accent || '#22d3ee'});`}></span>
																		<span class="h-5 w-5 rounded border border-white/10" style={`background: ${theme.tokens?.color_bg_primary || '#09090b'};`}></span>
																		<span class="h-5 w-5 rounded border border-white/10" style={`background: ${theme.tokens?.color_light_bg_primary || '#ffffff'};`}></span>
																		<span class="h-5 w-5 rounded border border-white/10" style={`background: ${theme.tokens?.color_text_primary || '#ffffff'};`}></span>
																	</div>
																</div>
																<div class="flex shrink-0 flex-wrap gap-1.5">
																	<button type="button" onclick={() => applyNamedTheme(theme)} disabled={managingTheme} title="Apply theme" class="rounded-lg bg-accent-500/15 p-2 text-accent-300 hover:bg-accent-500/25 disabled:opacity-50">
																		<Upload size={15} />
																	</button>
																	<button type="button" onclick={() => loadCustomTheme(theme)} title="Edit theme" class="rounded-lg bg-surface-800 p-2 text-surface-300 hover:text-white">
																		<Pencil size={15} />
																	</button>
																	<button type="button" onclick={() => duplicateCustomTheme(theme)} title="Duplicate theme" class="rounded-lg bg-surface-800 p-2 text-surface-300 hover:text-white">
																		<Copy size={15} />
																	</button>
																	<button type="button" onclick={() => deleteNamedTheme(theme)} disabled={managingTheme} title="Delete theme" class="rounded-lg bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50">
																		<Trash2 size={15} />
																	</button>
																</div>
															</div>
														</div>
													{:else}
														<div class="rounded-lg border border-dashed border-surface-700 p-5 text-center">
															<p class="text-sm font-medium text-white">No saved custom themes yet</p>
															<p class="mt-1 text-xs text-surface-500">Name the current token set and save it to build your theme library.</p>
														</div>
													{/each}
												</div>
											</section>
										</div>
									{/if}
									<div
										class="mt-4 overflow-hidden rounded-xl border border-surface-700"
										style={`background: ${preview.background};`}
									>
										<div class="h-2" style={`background: ${preview.gradient};`}></div>
										<div class="p-4">
											<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
												<div>
													<p class="text-xs font-semibold uppercase tracking-wider" style={`color: ${preview.muted};`}>
														Brand system preview
													</p>
													<p class="mt-1 text-sm" style={`color: ${preview.text};`}>
														Check dark and light mode before saving.
													</p>
												</div>
												<div class="inline-flex rounded-lg border p-1" style={`border-color: ${preview.border}; background: ${preview.panel};`}>
													<button
														type="button"
														onclick={() => customPreviewMode = 'dark'}
														class="px-3 py-1.5 text-xs font-medium transition-colors"
														style={`border-radius: ${preview.radiusMd}; color: ${customPreviewMode === 'dark' ? '#fff' : preview.muted}; background: ${customPreviewMode === 'dark' ? preview.gradient : 'transparent'};`}
													>
														Dark
													</button>
													<button
														type="button"
														onclick={() => customPreviewMode = 'light'}
														class="px-3 py-1.5 text-xs font-medium transition-colors"
														style={`border-radius: ${preview.radiusMd}; color: ${customPreviewMode === 'light' ? '#fff' : preview.muted}; background: ${customPreviewMode === 'light' ? preview.gradient : 'transparent'};`}
													>
														Light
													</button>
												</div>
											</div>

											<div class="mb-4 flex flex-wrap gap-1.5">
												{#each previewSurfaces as surface}
													<button
														type="button"
														onclick={() => previewSurface = surface.value}
														class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
														style={`border-color: ${preview.border}; color: ${previewSurface === surface.value ? '#fff' : preview.text}; background: ${previewSurface === surface.value ? preview.gradient : preview.panel};`}
													>
														{surface.label}
													</button>
												{/each}
											</div>

											<div
												class="overflow-hidden border"
												style={`border-color: ${preview.border}; border-radius: ${preview.radiusXl}; background: ${preview.panel}; font-family: ${preview.bodyFont || 'Inter'}, system-ui, sans-serif;`}
											>
												<div class="flex items-center justify-between border-b px-4 py-3" style={`border-color: ${preview.border};`}>
													<div class="flex items-center gap-2">
														<span class="h-8 w-8" style={`border-radius: ${preview.radiusMd}; background: ${preview.gradient};`}></span>
														<span class="text-sm font-semibold" style={`color: ${preview.heading};`}>AI Mematiane</span>
													</div>
													<div class="hidden items-center gap-4 sm:flex">
														<span class="text-xs" style={`color: ${preview.text};`}>Tools</span>
														<span class="text-xs" style={`color: ${preview.text};`}>News</span>
														<span class="text-xs" style={`color: ${preview.muted};`}>Blog</span>
													</div>
												</div>
												<div class="grid gap-4 p-4 lg:grid-cols-[1.3fr_0.7fr]">
													{#if previewSurface === 'homepage'}
														<div>
															<p class="text-xs font-semibold uppercase tracking-wider" style={`color: ${preview.muted};`}>
																Featured workflow
															</p>
															<h3
																class="mt-2 text-2xl leading-tight"
																style={`color: ${preview.heading}; font-family: ${preview.headingFont || 'Outfit'}, system-ui, sans-serif; font-weight: ${preview.headingWeight || '700'};`}
															>
																Discover tools with a sharper brand presence
															</h3>
															<p class="mt-3 max-w-xl text-sm leading-6" style={`color: ${preview.text}; font-weight: ${preview.bodyWeight || '400'};`}>
																Hero typography, navigation, calls to action, and card surfaces all need to stay coherent across themes.
															</p>
															<div class="mt-5 flex flex-wrap gap-2">
																<span class="inline-flex px-4 py-2 text-sm font-semibold text-white" style={`border-radius: ${preview.radiusMd}; background: ${preview.gradient};`}>
																	Explore tools
																</span>
																<span class="inline-flex border px-4 py-2 text-sm font-medium" style={`border-color: ${preview.border}; border-radius: ${preview.radiusMd}; color: ${preview.text};`}>
																	Read news
																</span>
															</div>
														</div>
														<div class="grid gap-3">
															<div class="border p-3" style={`border-color: ${preview.border}; border-radius: ${preview.radiusLg}; background: ${preview.background}; box-shadow: ${preview.shadowMd};`}>
																<p class="text-xs" style={`color: ${preview.muted};`}>Featured card</p>
																<p class="mt-1 text-sm font-semibold" style={`color: ${preview.heading};`}>AI Agent Builder</p>
																<p class="mt-2 text-xs leading-5" style={`color: ${preview.text};`}>A compact listing card with readable metadata and clear hierarchy.</p>
															</div>
															<div class="grid grid-cols-3 gap-2">
																<span class="h-10 border" style={`border-color: ${preview.border}; border-radius: ${preview.radiusMd}; background: ${preview.heading};`}></span>
																<span class="h-10 border" style={`border-color: ${preview.border}; border-radius: ${preview.radiusMd}; background: ${preview.text};`}></span>
																<span class="h-10 border" style={`border-color: ${preview.border}; border-radius: ${preview.radiusMd}; background: ${preview.muted};`}></span>
															</div>
														</div>
													{:else if previewSurface === 'directory'}
														<div class="lg:col-span-2 grid gap-3 sm:grid-cols-3">
															{#each ['Text generation', 'Image tools', 'Automation'] as label, idx}
																<div class="border p-3" style={`border-color: ${preview.border}; border-radius: ${preview.radiusLg}; background: ${idx === 0 ? preview.background : preview.panel}; box-shadow: ${idx === 0 ? preview.shadowMd : preview.shadowSm};`}>
																	<span class="inline-flex px-2 py-1 text-[11px] font-medium text-white" style={`border-radius: ${preview.radiusMd}; background: ${idx === 0 ? preview.gradient : preview.success};`}>{idx === 0 ? 'Featured' : 'Active'}</span>
																	<p class="mt-3 text-sm font-semibold" style={`color: ${preview.heading};`}>{label}</p>
																	<p class="mt-2 text-xs leading-5" style={`color: ${preview.text};`}>Directory item with badges, borders, and hover-ready elevation.</p>
																</div>
															{/each}
														</div>
													{:else if previewSurface === 'article'}
														<div class="lg:col-span-2 max-w-2xl">
															<p class="text-xs font-semibold uppercase tracking-wider" style={`color: ${preview.muted};`}>Deep Dive</p>
															<h3 class="mt-2 text-2xl" style={`color: ${preview.heading}; font-family: ${preview.headingFont || 'Outfit'}, system-ui, sans-serif; font-weight: ${preview.headingWeight};`}>Readable articles need strong contrast</h3>
															<p class="mt-3 text-sm leading-6" style={`color: ${preview.text};`}>Body copy should stay comfortable in both modes. Links use the accent ramp, while quotes and metadata use muted text without disappearing.</p>
															<div class="mt-4 border-l-4 py-2 pl-4 text-sm" style={`border-color: ${preview.warning}; color: ${preview.text}; background: ${preview.background}; border-radius: ${preview.radiusMd};`}>Preview pull quote, warning context, and prose rhythm.</div>
														</div>
													{:else}
														<div class="lg:col-span-2 grid gap-3 sm:grid-cols-[0.65fr_1.35fr]">
															<div class="border p-3" style={`border-color: ${preview.border}; border-radius: ${preview.radiusLg}; background: ${preview.background};`}>
																<p class="text-xs font-semibold" style={`color: ${preview.muted};`}>Admin nav</p>
																<div class="mt-3 space-y-2">
																	<span class="block px-3 py-2 text-xs text-white" style={`border-radius: ${preview.radiusMd}; background: ${preview.gradient};`}>Settings</span>
																	<span class="block px-3 py-2 text-xs" style={`border-radius: ${preview.radiusMd}; color: ${preview.text};`}>Themes</span>
																	<span class="block px-3 py-2 text-xs" style={`border-radius: ${preview.radiusMd}; color: ${preview.muted};`}>Audit</span>
																</div>
															</div>
															<div class="border p-3" style={`border-color: ${preview.border}; border-radius: ${preview.radiusLg}; background: ${preview.background}; box-shadow: ${preview.shadowLg};`}>
																<p class="text-sm font-semibold" style={`color: ${preview.heading};`}>Operational panel</p>
																<div class="mt-3 grid grid-cols-3 gap-2">
																	<span class="rounded px-2 py-2 text-center text-xs text-white" style={`background: ${preview.success};`}>Success</span>
																	<span class="rounded px-2 py-2 text-center text-xs text-white" style={`background: ${preview.warning};`}>Warning</span>
																	<span class="rounded px-2 py-2 text-center text-xs text-white" style={`background: ${preview.error};`}>Error</span>
																</div>
															</div>
														</div>
													{/if}
												</div>
											</div>
										</div>
									</div>
									{#if setting.value === 'custom'}
										<div class="mt-4 space-y-4">
											{#each customThemeFields as group}
												<section class="rounded-xl border border-surface-700 bg-surface-950/50 p-4">
													<div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
														<div>
															<h3 class="text-sm font-semibold text-white">{group.title}</h3>
															<p class="mt-1 text-xs text-surface-500">{group.description}</p>
														</div>
													</div>
													<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
														{#each group.fields as field}
															{@const themeSetting = getThemeSetting(field.key)}
															{#if themeSetting}
																<div>
																	<label for={`custom-theme-${field.key}`} class="block text-xs font-medium text-surface-400 mb-1.5">
																		{field.label}
																	</label>
																	{#if field.type === 'color'}
																		<div class="flex items-center gap-2">
																			<input
																				id={`custom-theme-${field.key}`}
																				type="color"
																				value={themeSetting.value || '#000000'}
																				oninput={(e) => handleThemeInput(field.key, e.currentTarget.value)}
																				class="h-10 w-12 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
																			/>
																			<input
																				type="text"
																				value={themeSetting.value || ''}
																				oninput={(e) => handleThemeInput(field.key, e.currentTarget.value)}
																				class="min-w-0 flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm font-mono text-white focus:border-accent-500 focus:outline-none"
																			/>
																		</div>
																	{:else if field.type === 'weight'}
																		<select
																			id={`custom-theme-${field.key}`}
																			value={themeSetting.value || '400'}
																			onchange={(e) => handleThemeInput(field.key, e.currentTarget.value)}
																			class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-accent-500 focus:outline-none"
																		>
																			<option value="300">Light (300)</option>
																			<option value="400">Regular (400)</option>
																			<option value="500">Medium (500)</option>
																			<option value="600">Semi-Bold (600)</option>
																			<option value="700">Bold (700)</option>
																			<option value="800">Extra Bold (800)</option>
																		</select>
																	{:else}
																		<input
																			id={`custom-theme-${field.key}`}
																			type="text"
																			value={themeSetting.value || ''}
																			placeholder={field.placeholder || ''}
																			oninput={(e) => handleThemeInput(field.key, e.currentTarget.value)}
																			class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm font-mono text-white focus:border-accent-500 focus:outline-none"
																		/>
																	{/if}
																</div>
															{:else}
																<div class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
																	Missing setting: {field.key}
																</div>
															{/if}
														{/each}
													</div>
												</section>
											{/each}
										</div>
									{/if}
								{/if}
							{:else if setting.input_type === 'text' || setting.input_type === 'url' || setting.input_type === 'email'}
								<input
									id={`site-setting-${setting.id}`}
									type={setting.input_type === 'email' ? 'email' : setting.input_type === 'url' ? 'url' : 'text'}
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.currentTarget.value)}
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm focus:outline-none focus:border-accent-500"
								/>
							{:else if setting.input_type === 'textarea' || setting.input_type === 'rich_text'}
								<textarea
									id={`site-setting-${setting.id}`}
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.currentTarget.value)}
									rows="4"
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm resize-none focus:outline-none focus:border-accent-500"
								></textarea>
							{:else if setting.input_type === 'image'}
								<div class="space-y-3">
									{#if setting.value}
										<img src={inlineImageUrl(setting.value)} alt="" class="w-20 h-20 rounded-lg object-contain border border-surface-700 bg-surface-950 p-1" />
									{:else}
										<div class="w-20 h-20 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center">
											<ImageIcon size={20} class="text-surface-500" />
										</div>
									{/if}
									<FileUpload
										label="Upload image"
										accept="image/*,.svg"
										path="media"
										onUploaded={(uploaded) => { if (uploaded[0]) handleInput(setting.id, uploaded[0]); }}
									/>
									<input
										type="url"
										value={setting.value || ''}
										oninput={(e) => handleInput(setting.id, e.currentTarget.value)}
										placeholder="Or paste image URL"
										class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm"
									/>
								</div>
							{:else if setting.input_type === 'boolean'}
								<label class="flex items-center gap-3 cursor-pointer">
									<input
										id={`site-setting-${setting.id}`}
										type="checkbox"
										checked={setting.value === 'true'}
										onchange={(e) => handleInput(setting.id, e.currentTarget.checked ? 'true' : 'false')}
										class="w-5 h-5 rounded bg-surface-800 border-surface-600 text-accent-500"
									/>
									<span class="text-sm text-surface-300">Enabled</span>
								</label>
							{:else if setting.input_type === 'json'}
								<textarea
									id={`site-setting-${setting.id}`}
									value={JSON.stringify(setting.value_json || {}, null, 2)}
									oninput={(e) => handleJsonValue(setting.id, e.currentTarget.value)}
									rows="6"
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm font-mono resize-none"
								></textarea>
							{:else}
								<input
									id={`site-setting-${setting.id}`}
									type="text"
									value={setting.value || ''}
									oninput={(e) => handleInput(setting.id, e.currentTarget.value)}
									class="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-white text-sm"
								/>
							{/if}
						</div>
					{:else}
						<p class="text-surface-500 text-sm">No settings in this category.</p>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
