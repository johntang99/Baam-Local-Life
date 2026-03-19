DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@baamplatform.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at, raw_user_meta_data)
    VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admin@baamplatform.com', crypt('Baam@Admin2025!', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '{"full_name":"Baam Admin"}'::jsonb);
  END IF;

  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@baamplatform.com';

  UPDATE profiles SET
    username = 'admin',
    display_name = 'Baam Admin',
    bio = 'Platform administrator',
    profile_type = 'user',
    primary_language = 'zh',
    region_id = (SELECT id FROM regions WHERE slug = 'flushing-ny'),
    is_verified = true
  WHERE id = v_admin_id;

  RAISE NOTICE 'Admin created: admin@baamplatform.com / Baam@Admin2025!';
END $$;
