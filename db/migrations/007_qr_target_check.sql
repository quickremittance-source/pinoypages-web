-- 007: QR targets may only point at pinoypages.ca /go, /card or /qr routes (Hana fix #8).
-- NOT applied to production; needs Jose's approval. Safe today: qr_codes has 0 rows.
alter table qr_codes drop constraint if exists qr_codes_target_pinoypages;
alter table qr_codes add constraint qr_codes_target_pinoypages
  check (target_url ~ '^https://(www\.)?pinoypages\.ca/(go|card|qr)/[A-Za-z0-9_-]{1,80}$') not valid;
alter table qr_codes validate constraint qr_codes_target_pinoypages;
