#!/usr/bin/env python3
"""
Script para configurar o banco de dados PostgreSQL
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    """Testar conexão com o banco de dados"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', '12345678'),
            database=os.getenv('DB_NAME', 'lab')
        )
        print("✅ Conexão com PostgreSQL bem-sucedida!")
        print(f"🗄️  Conectado ao banco: {os.getenv('DB_NAME', 'lab')}")
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Testando conexão com banco de dados PostgreSQL...")
    print(f"📍 Host: {os.getenv('DB_HOST', 'localhost')}")
    print(f"🔌 Porta: {os.getenv('DB_PORT', '5432')}")
    print(f"👤 Usuário: {os.getenv('DB_USER', 'postgres')}")
    print(f"🗄️  Banco: {os.getenv('DB_NAME', 'lab')}")
    print("-" * 50)
    
    # Testar conexão
    if test_connection():
        print("-" * 50)
        print("🚀 Banco de dados pronto para uso!")
        print("📋 As tabelas serão criadas automaticamente ao iniciar a API.")
    else:
        print("-" * 50)
        print("❌ Verifique se o PostgreSQL está rodando e as credenciais estão corretas!")
        print("💡 Dica: Inicie o PostgreSQL com: brew services start postgresql")
