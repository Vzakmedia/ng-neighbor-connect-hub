-- Fix existing video thumbnail URLs by replacing .mp4 with .jpg
UPDATE community_posts 
SET video_thumbnail_url = REPLACE(video_thumbnail_url, '.mp4', '.jpg')
WHERE video_url IS NOT NULL 
  AND video_thumbnail_url IS NOT NULL 
  AND video_thumbnail_url LIKE '%.mp4';