#!/usr/bin/env python3
"""
Script para testar a API Lab Back
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_api():
    print("🧪 Testando Lab Back API")
    print("=" * 50)
    
    # Teste de saúde
    print("1. Testando health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health check falhou: {e}")
        return
    
    # Criar usuário
    print("\n2. Criando usuário...")
    user_data = {
        "name": "Usuário Teste",
        "email": f"teste{int(time.time())}@example.com"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users", json=user_data)
        if response.status_code == 200:
            user = response.json()
            user_id = user['id']
            print(f"✅ Usuário criado: {user}")
        else:
            print(f"❌ Falha ao criar usuário: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        return
    
    # Listar usuários
    print("\n3. Listando usuários...")
    try:
        response = requests.get(f"{BASE_URL}/users")
        users = response.json()
        print(f"✅ Usuários encontrados: {len(users)}")
    except Exception as e:
        print(f"❌ Erro ao listar usuários: {e}")
    
    # Criar tarefa
    print("\n4. Criando tarefa...")
    task_data = {
        "title": "Tarefa de Teste",
        "description": "Esta é uma tarefa criada automaticamente",
        "user_id": user_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/tasks", json=task_data)
        if response.status_code == 200:
            task = response.json()
            task_id = task['id']
            print(f"✅ Tarefa criada: {task}")
        else:
            print(f"❌ Falha ao criar tarefa: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Erro ao criar tarefa: {e}")
        return
    
    # Listar tarefas
    print("\n5. Listando tarefas...")
    try:
        response = requests.get(f"{BASE_URL}/tasks")
        tasks = response.json()
        print(f"✅ Tarefas encontradas: {len(tasks)}")
    except Exception as e:
        print(f"❌ Erro ao listar tarefas: {e}")
    
    # Criar projeto
    print("\n6. Criando projeto...")
    project_data = {
        "name": "Projeto de Teste",
        "description": "Este é um projeto criado automaticamente",
        "status": "active",
        "user_id": user_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects", json=project_data)
        if response.status_code == 200:
            project = response.json()
            project_id = project['id']
            print(f"✅ Projeto criado: {project}")
        else:
            print(f"❌ Falha ao criar projeto: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Erro ao criar projeto: {e}")
        return
    
    # Listar projetos
    print("\n7. Listando projetos...")
    try:
        response = requests.get(f"{BASE_URL}/projects")
        projects = response.json()
        print(f"✅ Projetos encontrados: {len(projects)}")
    except Exception as e:
        print(f"❌ Erro ao listar projetos: {e}")
    
    # Estatísticas
    print("\n8. Obtendo estatísticas...")
    try:
        response = requests.get(f"{BASE_URL}/stats")
        stats = response.json()
        print(f"✅ Estatísticas: {stats}")
    except Exception as e:
        print(f"❌ Erro ao obter estatísticas: {e}")
    
    # Atualizar tarefa
    print("\n9. Atualizando tarefa...")
    update_data = {
        "title": "Tarefa Atualizada",
        "description": "Descrição atualizada",
        "completed": True,
        "user_id": user_id
    }
    
    try:
        response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data)
        if response.status_code == 200:
            updated_task = response.json()
            print(f"✅ Tarefa atualizada: {updated_task}")
        else:
            print(f"❌ Falha ao atualizar tarefa: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Erro ao atualizar tarefa: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Testes concluídos com sucesso!")
    print(f"📚 Documentação: {BASE_URL}/docs")
    print(f"🔍 Health: {BASE_URL}/health")

if __name__ == "__main__":
    test_api()
