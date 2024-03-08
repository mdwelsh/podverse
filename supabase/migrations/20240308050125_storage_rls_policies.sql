-- This migration adds RLS policies for storage.
-- A user can upload files in a directory named using the
-- podcast ID, if they are the owner of the podcast.
CREATE POLICY "Allow transcript upload" ON storage.objects FOR
INSERT
    TO authenticated WITH CHECK (
        bucket_id IN ('transcripts', 'summaries')
        AND is_podcast_owner_with_podcast_id(
            ((storage.foldername(name)) [1]) :: int8,
            requesting_user_id()
        )
    );

-- A user can upload files in a directory named using the
-- podcast ID, if they are the owner of the podcast.
CREATE POLICY "Allow transcript update" ON storage.objects FOR
UPDATE
    TO authenticated USING (
        bucket_id IN ('transcripts', 'summaries')
        AND is_podcast_owner_with_podcast_id(
            ((storage.foldername(name)) [1]) :: int8,
            requesting_user_id()
        )
    );

-- A user can delete files in a directory named using the
-- podcast ID, if they are the owner of the podcast.
CREATE POLICY "Allow transcript delete" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id IN ('transcripts', 'summaries')
    AND is_podcast_owner_with_podcast_id(
        ((storage.foldername(name)) [1]) :: int8,
        requesting_user_id()
    )
);