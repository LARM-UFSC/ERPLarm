-- Migration para adicionar 'administrador' à constraint check da tabela usuarios
-- Executar este script no banco de dados PostgreSQL

-- Remover a constraint antiga
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_usuario_check;

-- Adicionar nova constraint com 'administrador' incluído
ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_usuario_check 
    CHECK (tipo_usuario IN ('aluno', 'professor', 'colaborador', 'administrador'));
