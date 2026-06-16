<script>
	import { X } from '@lucide/svelte';

	let { open = $bindable(false), title = '', maxWidth = 'max-w-4xl', onClose = null, children } = $props();

	let dialogEl = $state(null);
	const titleId = 'modal-title-' + Math.random().toString(36).substring(2, 9);

	function close() {
		open = false;
		onClose?.();
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			return;
		}
		if (e.key === 'Tab') {
			trapFocus(e);
		}
	}

	function trapFocus(e) {
		if (!dialogEl) return;
		const focusable = dialogEl.querySelectorAll(
			'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
		);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	// Lock body scroll and move focus into the dialog when opened
	$effect(() => {
		if (open && dialogEl) {
			const previouslyFocused = document.activeElement;
			document.body.style.overflow = 'hidden';
			const firstInput = dialogEl.querySelector(
				'input:not([type="hidden"]):not([disabled]), textarea, select, button'
			);
			firstInput?.focus();
			return () => {
				document.body.style.overflow = '';
				if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
			};
		}
	});
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-10 px-4 overflow-y-auto"
		onclick={(e) => { if (e.target === e.currentTarget) close(); }}
		role="presentation"
	>
		<div
			bind:this={dialogEl}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			class="w-full {maxWidth} bg-surface-900 border border-surface-700 rounded-2xl p-6 mb-20 shadow-2xl"
		>
			<div class="flex items-center justify-between mb-6">
				<h2 id={titleId} class="text-lg font-semibold text-white">{title}</h2>
				<button
					type="button"
					onclick={close}
					class="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
					aria-label="Close dialog"
				>
					<X size={18} />
				</button>
			</div>
			{@render children?.()}
		</div>
	</div>
{/if}
