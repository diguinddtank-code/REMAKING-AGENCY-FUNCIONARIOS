-- 1. Enable UUID extension (optional but good practice)
create extension if not exists "uuid-ossp";

-- 2. TASKS TABLE
create table if not exists tasks (
  id text primary key, -- Using text to support frontend-generated IDs
  user_id uuid references auth.users not null,
  text text not null,
  completed boolean default false,
  time text,
  date text,
  category text,
  repeat text,
  "parentId" text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table tasks enable row level security;

-- Create Policy (CRUD)
create policy "Users can manage their own tasks" 
on tasks for all 
using (auth.uid() = user_id);


-- 3. LEADS TABLE (CRM)
create table if not exists crm_leads (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  company text,
  status text,
  value numeric,
  "lastContact" text,
  phone text,
  notes text,
  payments jsonb default '[]'::jsonb,
  reports jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table crm_leads enable row level security;

create policy "Users can manage their own leads" 
on crm_leads for all 
using (auth.uid() = user_id);


-- 4. GOALS TABLE
create table if not exists goals (
  id text primary key,
  user_id uuid references auth.users not null,
  title text not null,
  current numeric default 0,
  target numeric default 0,
  deadline text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table goals enable row level security;

create policy "Users can manage their own goals" 
on goals for all 
using (auth.uid() = user_id);


-- 5. TRANSACTIONS TABLE
create table if not exists transactions (
  id text primary key,
  user_id uuid references auth.users not null,
  description text not null,
  amount numeric not null,
  type text not null,
  date text,
  category text,
  "isFixed" boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table transactions enable row level security;

create policy "Users can manage their own transactions" 
on transactions for all 
using (auth.uid() = user_id);


-- 6. FINANCIALS TABLE (Summary)
create table if not exists financials (
  user_id uuid references auth.users primary key,
  salary numeric default 0,
  expenses numeric default 0,
  "updatedAt" numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table financials enable row level security;

create policy "Users can manage their own financials" 
on financials for all 
using (auth.uid() = user_id);


-- 7. STORAGE POLICIES (Run this AFTER creating a bucket named 'agency-files' in the dashboard)
-- Note: You must create the bucket 'agency-files' manually in the Storage dashboard first.
-- Make sure the bucket is Public if you want shareable links, or Private for strict access.

-- Allow users to upload files to their own folder
create policy "Users can upload their own files"
on storage.objects for insert
with check (
  bucket_id = 'agency-files' AND
  auth.uid() = owner
);

-- Allow users to view their own files
create policy "Users can view their own files"
on storage.objects for select
using (
  bucket_id = 'agency-files' AND
  auth.uid() = owner
);

-- Allow users to update their own files
create policy "Users can update their own files"
on storage.objects for update
using (
  bucket_id = 'agency-files' AND
  auth.uid() = owner
);

-- Allow users to delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
using (
  bucket_id = 'agency-files' AND
  auth.uid() = owner
);
