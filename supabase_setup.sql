-- Create the table for waitlist signups
create table waitlist_signups (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null unique,
  industry text not null
);

-- Enable Row Level Security (RLS)
alter table waitlist_signups enable row level security;

-- Policy: Allow public to insert (since it's a public form)
-- Ideally, you'd use a service role key on the server-side to bypass RLS,
-- but if calling from client directly, you'd need this policy.
-- Since our code uses the SERVICE_ROLE_KEY in the API route, 
-- explicit policies for 'anon' are not strictly needed for insertion,
-- but good practice to deny reads.

-- Deny read access to public (anon key)
create policy "No read access for public"
  on waitlist_signups
  for select
  using (false);
