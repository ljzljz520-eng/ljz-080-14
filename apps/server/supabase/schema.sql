-- 慢病药盒管理 Supabase/Postgres 表结构
-- 与服务端内存模型一一对应，接入真实环境时替换 StoreService 即可

create table if not exists elders (
  id text primary key,
  name text not null,
  age int,
  gender text,
  address text,
  room_no text,
  manager_id text,
  primary_family_id text,
  created_at timestamptz default now()
);

create table if not exists family_contacts (
  id text primary key,
  elder_id text references elders(id) on delete cascade,
  name text not null,
  relation text,
  phone text
);

create table if not exists caregivers (
  id text primary key,
  name text not null,
  phone text
);

create table if not exists medications (
  id text primary key,
  elder_id text references elders(id) on delete cascade,
  name text not null,
  -- 慢病分类属于内部健康档案：家属端接口不得返回该字段
  category text not null check (category in ('hypertension','diabetes','other_chronic')),
  dosage_text text,
  schedule_text text,
  doses_per_day numeric not null default 1,
  stock_doses numeric not null default 0,
  threshold_days int not null default 7,
  next_visit_date date not null,
  buyer_channel text check (buyer_channel in ('family','pharmacy','online')),
  buyer_name text,
  buyer_lead_days int not null default 2,
  buyer_note text,
  status text not null default 'active',
  created_at timestamptz default now()
);

create table if not exists med_photos (
  id text primary key,
  storage_url text not null,   -- Supabase Storage 公开地址
  label text,
  created_at timestamptz default now()
);

create table if not exists med_checks (
  id text primary key,
  elder_id text references elders(id) on delete cascade,
  caregiver_id text references caregivers(id),
  visit_at timestamptz default now(),
  summary text,
  photo_ids text[] default '{}'
);

create table if not exists med_check_items (
  id bigserial primary key,
  check_id text references med_checks(id) on delete cascade,
  med_id text references medications(id),
  condition text not null check (condition in
    ('normal','suspected_missed','suspected_mixed','low_stock')),
  stock_observed numeric,
  note text
);

create table if not exists health_observations (
  id text primary key,
  elder_id text references elders(id) on delete cascade,
  check_id text references med_checks(id),
  type text not null check (type in ('missed_dose','mixed_pills','abnormal_stock')),
  severity text not null check (severity in ('info','warning','critical')),
  content text not null,          -- 内部观察详情，家属端不可见
  suggestion text not null,       -- 下一步建议，可对家属展示
  photo_ids text[] default '{}',
  acknowledged boolean default false,
  created_at timestamptz default now()
);

-- 家属端行级安全：仅可读取已关联老人
-- create policy "family_related_elders" on elders
--   for select using (id in (select elder_id from family_contacts where id = auth.jwt() ->> 'family_id'));
