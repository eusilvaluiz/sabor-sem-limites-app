-- CRIAR ADMIN AUTENTICADO NO SUPABASE

-- 1. Criar usuario no sistema auth do Supabase
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@deliciasdobem.com',
  crypt('Admin@2024', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Criar perfil na tabela users usando mesmo ID
INSERT INTO public.users (
  id,
  name,
  email,
  password_hash,
  avatar_url,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@deliciasdobem.com'),
  'Admin Master',
  'admin@deliciasdobem.com',
  'Admin@2024',
  null,
  'admin',
  NOW(),
  NOW()
);

-- 3. Criar identidade para o usuario
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'admin@deliciasdobem.com'),
  format('{"sub":"%s","email":"%s"}', 
    (SELECT id FROM auth.users WHERE email = 'admin@deliciasdobem.com'), 
    'admin@deliciasdobem.com'
  )::jsonb,
  'email',
  (SELECT id FROM auth.users WHERE email = 'admin@deliciasdobem.com'),
  NOW(),
  NOW(),
  NOW()
); 