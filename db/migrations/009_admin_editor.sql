-- 009: internal admin editor. Manual-override lock (Brevo sync skips locked rows), soft delete (archive), ad dates,
-- and an audit log of every admin change (before/after JSON).
alter table listings add column if not exists locked boolean not null default false;
alter table listings add column if not exists archived_at timestamptz;
alter table ads add column if not exists start_date date;
alter table ads add column if not exists end_date date;
alter table ads add column if not exists archived_at timestamptz;
create table if not exists admin_audit (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  actor   text not null default 'admin',
  entity  text not null check (entity in ('listing', 'ad')),
  ref     text not null,
  action  text not null,
  before  jsonb,
  after   jsonb
);
create index if not exists admin_audit_ref_idx on admin_audit (entity, ref, at desc);
