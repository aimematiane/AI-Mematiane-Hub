-- Aggregate public-facing engagement counts without exposing bookmark ownership.
CREATE OR REPLACE FUNCTION public.get_content_metrics(p_item_type TEXT, p_item_ids UUID[])
RETURNS TABLE (
  item_id UUID,
  upvotes_count BIGINT,
  bookmarks_count BIGINT,
  comments_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ids.item_id,
    COALESCE(upvote_counts.count, 0) AS upvotes_count,
    COALESCE(bookmark_counts.count, 0) AS bookmarks_count,
    COALESCE(comment_counts.count, 0) AS comments_count
  FROM unnest(p_item_ids) AS ids(item_id)
  LEFT JOIN (
    SELECT item_id, COUNT(*) AS count
    FROM public.upvotes
    WHERE item_type = p_item_type AND item_id = ANY(p_item_ids)
    GROUP BY item_id
  ) upvote_counts ON upvote_counts.item_id = ids.item_id
  LEFT JOIN (
    SELECT item_id, COUNT(*) AS count
    FROM public.bookmarks
    WHERE item_type = p_item_type AND item_id = ANY(p_item_ids)
    GROUP BY item_id
  ) bookmark_counts ON bookmark_counts.item_id = ids.item_id
  LEFT JOIN (
    SELECT item_id, COUNT(*) AS count
    FROM public.reviews
    WHERE item_type = p_item_type AND item_id = ANY(p_item_ids)
    GROUP BY item_id
  ) comment_counts ON comment_counts.item_id = ids.item_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_content_metrics(TEXT, UUID[]) TO anon, authenticated;
