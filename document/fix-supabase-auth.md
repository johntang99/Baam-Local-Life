# Fix Supabase Auth — "Database error querying schema"

## Problem
All auth operations (login, signup, admin user creation) fail with:
```
{"code":500,"error_code":"unexpected_failure","msg":"Database error querying schema"}
```

The `public` schema works fine (businesses, articles, etc. all query successfully). Only the `auth` schema is broken.

## Root Cause
GoTrue (Supabase Auth service) cannot access the `auth.users` table. This is a Supabase infrastructure issue, not a code bug.

## Fix Steps (In Supabase Dashboard)

### Option 1: Restart the Project (Quickest)
1. Go to https://supabase.com/dashboard
2. Select the Baam project
3. Go to **Settings** → **General**
4. Click **Restart project** (or Pause then Resume)
5. Wait 2-3 minutes for the project to restart
6. Test login again

### Option 2: Run SQL in SQL Editor
1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query to check the auth schema:
```sql
-- Check if auth.users table is accessible
SELECT count(*) FROM auth.users;

-- Check if handle_new_user trigger exists
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- If the trigger is causing issues, disable it temporarily:
-- ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
```
3. If the query fails, the auth schema needs repair. Contact Supabase support.

### Option 3: Check for Failed Migrations
1. Go to Supabase Dashboard → **Database** → **Migrations**
2. Check if any migration failed
3. If yes, fix or rollback the failed migration

## After Auth is Fixed
Create the admin user:
```sql
-- In Supabase SQL Editor:
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@baamplatform.com',
  crypt('Baam@Admin2025!', gen_salt('bf')),
  NOW(),
  '{"full_name":"Admin","role":"admin"}'::jsonb,
  NOW(), NOW()
);
```

Or via the Dashboard:
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Email: `admin@baamplatform.com`
4. Password: `Baam@Admin2025!`
5. Check "Auto Confirm User"
