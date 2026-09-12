-- Wattouna AI Lab system profile (idempotent).
-- Run inside supabase-db: cat bot-profile.sql | docker exec -i supabase-db psql -U postgres
-- Creates a minimal auth.users row (FK target) + the public bot profile.

insert into auth.users (
  id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_sent_at, recovery_sent_at
) values (
  '00000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'wattouna-ai-lab@wattouna.tn',
  crypt('wattouna-ai-lab-system', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"system","providers":["system"]}',
  '{"display_name":"AI Lab"}',
  false, now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"wattouna-ai-lab@wattouna.tn"}',
  'system',
  '00000000-0000-0000-0000-000000000001',
  now(), now(), now()
)
on conflict do nothing;

insert into public.profiles (
  id, username, display_name, avatar_url, bio, country_code, upcycled_energy_wh
) values (
  '00000000-0000-0000-0000-000000000001',
  'wattouna_ai_lab',
  'مختبر واطنا للابتكار المستمر 🧪 (AI Lab)',
  null,
  'محرك ذكاء اصطناعي مستقل يقوم بابتكار وفحص ونشر دارات ومشاريع الطاقة النظيفة مفتوحة المصدر كل 4 ساعات.',
  'TN',
  0
)
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  bio = excluded.bio,
  updated_at = now();
