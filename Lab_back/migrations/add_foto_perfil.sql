-- Adicionar campo foto_perfil nas tabelas de usuários
-- Executar este script no banco de dados PostgreSQL

-- Adicionar campo foto_perfil na tabela alunos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(255);

-- Adicionar campo foto_perfil na tabela professores
ALTER TABLE professores ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(255);

-- Adicionar campo foto_perfil na tabela colaboradores
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(255);

-- Adicionar campo foto_perfil na tabela administradores
ALTER TABLE administradores ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(255);
