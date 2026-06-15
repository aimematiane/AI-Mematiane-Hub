<script>
	import { Star, MessageSquare, Trash2, Send, Loader2, User } from '@lucide/svelte';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { optimizeImageUrl } from '$lib/utils/image';

	let { itemId, itemType } = $props();
	const client = getSupabaseBrowserClient();

	let comments = $state([]);
	let user = $state(null);
	let loading = $state(true);
	let submitting = $state(false);

	// Form fields
	let content = $state('');
	let rating = $state(null); // Used if itemType === 'ai_tool'
	let ratingHover = $state(0);

	$effect(() => {
		if (itemId && itemType) {
			fetchComments();
			checkUser();
		}
	});

	async function checkUser() {
		const { data: { user: authUser } } = await client.auth.getUser();
		user = authUser;
	}

	async function fetchComments() {
		loading = true;
		const { data, error } = await client
			.from('reviews')
			.select('id, rating, content, created_at, user_id, user:profiles(display_name, avatar_url)')
			.eq('item_type', itemType)
			.eq('item_id', itemId)
			.order('created_at', { ascending: false });

		if (!error && data) {
			comments = data;
		}
		loading = false;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!user) return window.location.href = '/auth/login';
		if (!content.trim()) return;
		if (itemType === 'ai_tool' && !rating) {
			alert('Please select a star rating.');
			return;
		}

		submitting = true;

		const insertData = {
			user_id: user.id,
			item_type: itemType,
			item_id: itemId,
			content: content.trim(),
			rating: itemType === 'ai_tool' ? rating : null
		};

		const { data: newReview, error } = await client
			.from('reviews')
			.insert(insertData)
			.select('id, rating, content, created_at, user_id, user:profiles(display_name, avatar_url)')
			.single();

		if (!error && newReview) {
			comments = [newReview, ...comments];
			content = '';
			rating = null;
		} else {
			console.error('Error inserting review:', error);
		}
		submitting = false;
	}

	async function handleDelete(commentId) {
		if (!confirm('Are you sure you want to delete this comment?')) return;

		const { error } = await client
			.from('reviews')
			.delete()
			.eq('id', commentId)
			.eq('user_id', user.id);

		if (!error) {
			comments = comments.filter(c => c.id !== commentId);
		} else {
			console.error('Error deleting comment:', error);
		}
	}

	function formatDate(d) {
		return new Date(d).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mt-12 pt-10 border-t border-white/5 relative z-10">
	<h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
		<MessageSquare size={20} class="text-accent-400" />
		{#if itemType === 'ai_tool'}
			Reviews & Ratings ({comments.length})
		{:else}
			Comments ({comments.length})
		{/if}
	</h3>

	<!-- Post Comment / Review Form -->
	{#if user}
		<form onsubmit={handleSubmit} class="glass-card p-6 rounded-2xl mb-8 border border-white/5 bg-surface-900/20 backdrop-blur-md">
			<div class="flex items-start gap-4">
				<!-- Current User Avatar -->
				<div class="hidden sm:block shrink-0 mt-1">
					<div class="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center border border-accent-500/20 text-accent-400 font-semibold">
						{user.email.charAt(0).toUpperCase()}
					</div>
				</div>

				<div class="flex-1 space-y-4">
					<!-- Star Rating Selector (Only for AI Tools) -->
					{#if itemType === 'ai_tool'}
						<div>
							<span class="block text-sm text-surface-400 mb-2">Your Rating *</span>
							<div class="flex items-center gap-1.5">
								{#each Array(5) as _, i}
									<button 
										type="button"
										onclick={() => rating = i + 1}
										onmouseenter={() => ratingHover = i + 1}
										onmouseleave={() => ratingHover = 0}
										class="p-1 hover:scale-110 active:scale-95 transition-transform"
										aria-label="Rate {i + 1} Stars"
									>
										<Star 
											size={20} 
											class="transition-colors duration-200 {i + 1 <= (ratingHover || rating) ? 'text-amber-400' : 'text-surface-700'}" 
											fill={i + 1 <= (ratingHover || rating) ? 'currentColor' : 'transparent'}
										/>
									</button>
								{/each}
								{#if rating}
									<span class="text-xs text-amber-400 font-medium ml-2">{rating} of 5 stars</span>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Comment content -->
					<div>
						<label for="review-content" class="sr-only">Write your thoughts</label>
						<textarea
							id="review-content"
							bind:value={content}
							placeholder={itemType === 'ai_tool' ? 'Share your experience with this tool...' : 'Join the discussion...'}
							rows="4"
							required
							class="w-full px-4 py-3 rounded-xl bg-surface-950/40 border border-white/10 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all text-sm leading-relaxed resize-none"
						></textarea>
					</div>

					<div class="flex justify-end">
						<button 
							type="submit" 
							disabled={submitting || !content.trim()} 
							class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-cyan-500 hover:from-accent-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-md shadow-accent-500/10 hover:shadow-accent-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
						>
							{#if submitting}
								<Loader2 size={16} class="animate-spin" />
								Posting...
							{:else}
								<Send size={16} />
								Post {itemType === 'ai_tool' ? 'Review' : 'Comment'}
							{/if}
						</button>
					</div>
				</div>
			</div>
		</form>
	{:else}
		<div class="glass-card p-6 rounded-2xl mb-8 border border-white/5 bg-surface-900/20 text-center">
			<p class="text-surface-400 text-sm mb-4">Please log in to write a comment or review.</p>
			<a href="/auth/login" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all">
				Log In to Post
			</a>
		</div>
	{/if}

	<!-- Comments List -->
	{#if loading}
		<div class="flex items-center justify-center py-10">
			<Loader2 size={24} class="animate-spin text-accent-500" />
		</div>
	{:else if comments.length > 0}
		<div class="space-y-4">
			{#each comments as c (c.id)}
				<div class="glass-card p-5 rounded-2xl border border-white/5 bg-surface-900/10 hover:bg-surface-900/20 hover:border-white/10 transition-all">
					<div class="flex items-start justify-between gap-4">
						<!-- User profile header -->
						<div class="flex items-center gap-3">
							{#if c.user?.avatar_url}
								<img src={optimizeImageUrl(c.user.avatar_url, { width: 100, quality: 80 })} alt="" class="w-9 h-9 rounded-full object-cover border border-white/10" />
							{:else}
								<div class="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center border border-white/5 text-surface-400">
									<User size={14} />
								</div>
							{/if}
							<div>
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-bold text-white text-sm">{c.user?.display_name || 'Anonymous User'}</span>
									<!-- Star display -->
									{#if c.rating}
										<div class="flex items-center gap-0.5">
											{#each Array(5) as _, starIdx}
												<Star 
													size={12} 
													class={starIdx < c.rating ? 'text-amber-400' : 'text-surface-800'} 
													fill={starIdx < c.rating ? 'currentColor' : 'transparent'} 
												/>
											{/each}
										</div>
									{/if}
								</div>
								<span class="text-xs text-surface-500">{formatDate(c.created_at)}</span>
							</div>
						</div>

						<!-- Delete button for owner -->
						{#if user && user.id === c.user_id}
							<button 
								onclick={() => handleDelete(c.id)}
								class="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
								aria-label="Delete comment"
							>
								<Trash2 size={15} />
							</button>
						{/if}
					</div>

					<!-- Content body -->
					<div class="mt-3.5 pl-0 sm:pl-12 text-sm text-surface-300 leading-relaxed break-words whitespace-pre-line">
						{c.content}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-10 border border-dashed border-white/5 rounded-2xl">
			<p class="text-surface-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
		</div>
	{/if}
</div>
