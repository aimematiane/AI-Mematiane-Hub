export async function loadContentMetrics(client, itemType, itemIds = []) {
	const ids = [...new Set(itemIds.filter(Boolean))];
	if (ids.length === 0) return {};

	const zeroMetrics = Object.fromEntries(ids.map((id) => [id, { upvotes: 0, bookmarks: 0, comments: 0 }]));

	const { data, error } = await client.rpc('get_content_metrics', {
		p_item_type: itemType,
		p_item_ids: ids
	});

	if (error || !data) {
		return zeroMetrics;
	}

	return {
		...zeroMetrics,
		...Object.fromEntries(
			data.map((row) => [
				row.item_id,
				{
					upvotes: row.upvotes_count || 0,
					bookmarks: row.bookmarks_count || 0,
					comments: row.comments_count || 0
				}
			])
		)
	};
}
