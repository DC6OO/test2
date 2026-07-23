-- Run once in Supabase → SQL Editor (creates cloud storage + shop data table)

insert into storage.buckets (id, name, public)
values ('shop-images', 'shop-images', true)
on conflict (id) do update set public = true;

create table if not exists shop_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table shop_settings enable row level security;

drop policy if exists "Public read shop settings" on shop_settings;
create policy "Public read shop settings"
  on shop_settings for select
  using (true);

drop policy if exists "Authenticated write shop settings" on shop_settings;
create policy "Authenticated write shop settings"
  on shop_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Public read shop images" on storage.objects;
create policy "Public read shop images"
  on storage.objects for select
  using (bucket_id = 'shop-images');

drop policy if exists "Authenticated upload shop images" on storage.objects;
create policy "Authenticated upload shop images"
  on storage.objects for insert
  with check (bucket_id = 'shop-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated update shop images" on storage.objects;
create policy "Authenticated update shop images"
  on storage.objects for update
  using (bucket_id = 'shop-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete shop images" on storage.objects;
create policy "Authenticated delete shop images"
  on storage.objects for delete
  using (bucket_id = 'shop-images' and auth.role() = 'authenticated');
