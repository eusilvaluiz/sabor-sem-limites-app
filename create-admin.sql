-- =============================================
-- CRIAR USUÁRIO ADMIN
-- =============================================

-- 1. Inserir na tabela auth.users (sistema de autenticação)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
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
  'admin@deliciasemculpa.com',
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Inserir na tabela users (dados do perfil)
INSERT INTO public.users (
  id,
  name,
  email,
  password_hash,
  role
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@deliciasemculpa.com'),
  'Admin Master',
  'admin@deliciasemculpa.com',
  crypt('Admin@123', gen_salt('bf')),
  'admin'
);

-- 3. Atualizar Assistant ID na configuração da Chef LéIA
UPDATE chef_leia_config 
SET assistant_id = 'asst_Eta1o4Ae0bMeILPYKeVeqlxA'
WHERE id = (SELECT id FROM chef_leia_config LIMIT 1);

-- =============================================
-- PRONTO! AGORA VOCÊ PODE FAZER LOGIN COM:
-- Email: admin@deliciasemculpa.com
-- Senha: Admin@123
-- =============================================
