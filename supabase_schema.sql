-- Enable UUID extension (optional now, but good to have)
create extension if not exists "uuid-ossp";

-- Create Tasks Table
create table tasks (
  id text primary key, -- Changed from uuid to text to support custom IDs
  user_id uuid references auth.users not null,
  text text not null,
  completed boolean default false,
  time text,
  category text,
  date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Leads Table (Renamed to crm_leads)
create table crm_leads (
  id text primary key, -- Changed from uuid to text
  user_id uuid references auth.users not null,
  name text not null,
  company text,
  value numeric default 0,
  status text default 'Potencial',
  last_contact text,
  phone text,
  notes text,
  payments jsonb default '{}'::jsonb,
  reports jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Transactions Table
create table transactions (
  id text primary key, -- Changed from uuid to text
  user_id uuid references auth.users not null,
  description text not null,
  amount numeric default 0,
  type text check (type in ('income', 'expense')),
  date text,
  category text,
  is_fixed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Goals Table
create table goals (
  id text primary key, -- Changed from uuid to text
  user_id uuid references auth.users not null,
  title text not null,
  current numeric default 0,
  target numeric default 0,
  deadline text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Financials Table (User Settings)
create table financials (
  user_id uuid references auth.users primary key,
  salary numeric default 0,
  expenses numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table tasks enable row level security;
alter table crm_leads enable row level security;
alter table transactions enable row level security;
alter table goals enable row level security;
alter table financials enable row level security;

-- Create Policies
create policy "Users can view their own tasks" on tasks for select using (auth.uid() = user_id);
create policy "Users can insert their own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on tasks for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks" on tasks for delete using (auth.uid() = user_id);

create policy "Users can view their own crm_leads" on crm_leads for select using (auth.uid() = user_id);
create policy "Users can insert their own crm_leads" on crm_leads for insert with check (auth.uid() = user_id);
create policy "Users can update their own crm_leads" on crm_leads for update using (auth.uid() = user_id);
create policy "Users can delete their own crm_leads" on crm_leads for delete using (auth.uid() = user_id);

create policy "Users can view their own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert their own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update their own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete their own transactions" on transactions for delete using (auth.uid() = user_id);

create policy "Users can view their own goals" on goals for select using (auth.uid() = user_id);
create policy "Users can insert their own goals" on goals for insert with check (auth.uid() = user_id);
create policy "Users can update their own goals" on goals for update using (auth.uid() = user_id);
create policy "Users can delete their own goals" on goals for delete using (auth.uid() = user_id);

create policy "Users can view their own financials" on financials for select using (auth.uid() = user_id);
create policy "Users can insert their own financials" on financials for insert with check (auth.uid() = user_id);
create policy "Users can update their own financials" on financials for update using (auth.uid() = user_id);
