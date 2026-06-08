#!/usr/bin/env python3
"""
Script para limpar o banco de dados de desenvolvimento.
Remove todos os dados das tabelas, mas mantém a estrutura.
"""

import sqlite3
import os

def clear_database():
    db_path = os.path.join(os.path.dirname(__file__), 'lab_database.db')
    
    if not os.path.exists(db_path):
        print(f"Banco de dados não encontrado em: {db_path}")
        return
    
    print(f"Conectando ao banco de dados: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Lista de tabelas na ordem correta (respeitando chaves estrangeiras)
    tables = [
        'projeto_atividades',
        'projeto_reunioes',
        'projeto_materiais',
        'projetos',
        'material_permanente',
        'material_consumo',
        'colaboradores',
        'professores',
        'alunos',
        'usuarios'
    ]
    
    print("\nLimpando tabelas...")
    for table in tables:
        try:
            # Verificar se a tabela existe
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if cursor.fetchone():
                # Contar registros antes de deletar
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                
                # Deletar todos os registros
                cursor.execute(f"DELETE FROM {table}")
                
                # Resetar autoincrement (se houver)
                cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
                
                print(f"  ✓ {table}: {count} registros removidos")
            else:
                print(f"  - {table}: tabela não encontrada")
        except Exception as e:
            print(f"  ✗ {table}: erro ao limpar - {e}")
    
    conn.commit()
    
    # Verificar se o banco está vazio
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    all_tables = [row[0] for row in cursor.fetchall()]
    
    print("\nVerificando tabelas restantes...")
    for table in all_tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count} registros")
    
    conn.close()
    print("\n✓ Banco de dados limpo com sucesso!")

if __name__ == "__main__":
    print("=" * 50)
    print("SCRIPT PARA LIMPAR BANCO DE DADOS")
    print("=" * 50)
    print("\n⚠️  ATENÇÃO: Este script irá remover TODOS os dados do banco!")
    print("   A estrutura das tabelas será mantida.\n")
    
    response = input("Deseja continuar? (digite 'SIM' para confirmar): ")
    
    if response.upper() == 'SIM':
        clear_database()
    else:
        print("Operação cancelada.")
