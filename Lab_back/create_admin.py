#!/usr/bin/env python3
"""
Script para criar um usuário administrador padrão
"""
import psycopg2
import uuid
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

def create_admin_user():
    """Criar usuário administrador padrão"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', '12345678'),
            database=os.getenv('DB_NAME', 'lab')
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Gerar IDs
        admin_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Senha padrão: admin123
        password = "admin123"
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Inserir administrador
        cursor.execute("""
            INSERT INTO administradores (id, nome, cpf, telefone, email, data_cadastro)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (cpf) DO NOTHING
        """, (admin_id, 'Administrador', '000.000.000-00', '(00) 00000-0000', 'admin@lab.com'))
        
        # Inserir usuário na tabela de autenticação
        cursor.execute("""
            INSERT INTO usuarios (id, email, password_hash, tipo_usuario, perfil_id, data_cadastro)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO NOTHING
        """, (user_id, 'admin@lab.com', password_hash, 'administrador', admin_id))
        
        print("✅ Usuário administrador criado com sucesso!")
        print(f"📧 Email: admin@lab.com")
        print(f"🔑 Senha: {password}")
        print(f"⚠️  Altere a senha após o primeiro login!")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar administrador: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Criando usuário administrador padrão...")
    print("-" * 50)
    
    if create_admin_user():
        print("-" * 50)
        print("🚀 Administrador criado com sucesso!")
    else:
        print("-" * 50)
        print("❌ Verifique se o banco de dados está rodando!")
