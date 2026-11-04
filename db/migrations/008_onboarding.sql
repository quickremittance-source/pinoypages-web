-- 008: onboarding queue. NOT applied to production; needs Jose's approval.
-- Inquiry decisions + link to what was created; live video check timestamp on listings.
alter table inquiries add column if not exists decided_at timestamptz;
alter table inquiries add column if not exists created_ref text;        -- 'listing:<listing_id>' or 'ad:<slug>'
alter table listings add column if not exists video_check_at timestamptz; -- set only when Jose marks the live video check passed
alter table listings add column if not exists onboarded_inquiry bigint;
