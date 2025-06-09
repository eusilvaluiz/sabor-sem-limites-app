-- VERIFICAR INCONSISTENCIA DOS DADOS DO ADMIN

-- 1. Verificar admin na tabela auth.users
SELECT 
  'AUTH USERS' as tabela,
  id, 
  email, 
  created_at,
  CASE WHEN encrypted_password IS NOT NULL THEN 'SENHA CRIPTOGRAFADA' ELSE 'SEM SENHA' END as status_senha
FROM auth.users 
WHERE email = 'admin@deliciasdobem.com';

-- 2. Verificar admin na tabela public.users  
SELECT 
  'PUBLIC USERS' as tabela,
  id, 
  email, 
  password_hash as senha_visivel,
  role,
  created_at
FROM public.users 
WHERE email = 'admin@deliciasdobem.com';

-- 3. Verificar se IDs batem entre as tabelas
SELECT 
  'COMPARACAO IDS' as teste,
  auth.id as auth_id,
  pub.id as public_id,
  CASE WHEN auth.id = pub.id THEN 'IDS IGUAIS' ELSE 'IDS DIFERENTES' END as resultado
FROM auth.users auth
FULL OUTER JOIN public.users pub ON auth.email = pub.email
WHERE auth.email = 'admin@deliciasdobem.com' OR pub.email = 'admin@deliciasdobem.com'; 