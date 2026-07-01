-- Script para criar um usuário administrador padrão
-- Executar este script no banco de dados PostgreSQL

-- Inserir administrador na tabela administradores
INSERT INTO administradores (id, nome, cpf, telefone, email, foto_perfil, data_cadastro)
VALUES (
    'admin-default-id',
    'Administrador',
    '000.000.000-00',
    '(00) 00000-0000',
    'admin@lab.com',
    NULL,
    CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO NOTHING;

-- Inserir usuário na tabela de autenticação
-- Senha: admin123 (hash gerado com bcrypt)
INSERT INTO usuarios (id, email, password_hash, tipo_usuario, perfil_id, data_cadastro)
VALUES (
    'user-admin-default-id',
    'admin@lab.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7xq5x7Fqrm',
    'administrador',
    'admin-default-id',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
