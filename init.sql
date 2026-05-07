-- Script de inicialização do banco de dados
-- Este script será executado quando o container PostgreSQL for iniciado pela primeira vez

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabelas se não existirem
-- (As tabelas serão criadas pela aplicação FastAPI, mas podemos preparar algumas configurações aqui)

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Inserir dados iniciais se necessário
-- (Os dados iniciais podem ser inseridos aqui ou pela API)
