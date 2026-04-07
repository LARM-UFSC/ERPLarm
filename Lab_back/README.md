# Lab Back - API FastAPI

API completa desenvolvida com FastAPI para servir o frontend React/Vite.

## 🚀 Funcionalidades

- **CRUD completo** para Usuários, Tarefas e Projetos
- **Banco de dados SQLite** com relacionamentos
- **CORS configurado** para integração com frontend
- **Documentação automática** via Swagger/OpenAPI
- **Validação de dados** com Pydantic
- **Tratamento de erros** adequado
- **Endpoint de estatísticas**

## 📋 Endpoints

### Base
- `GET /` - Mensagem de boas-vindas
- `GET /health` - Verificação de saúde da API
- `GET /docs` - Documentação Swagger
- `GET /redoc` - Documentação ReDoc

### Usuários
- `POST /users` - Criar usuário
- `GET /users` - Listar todos os usuários
- `GET /users/{user_id}` - Obter usuário específico

### Tarefas
- `POST /tasks` - Criar tarefa
- `GET /tasks` - Listar tarefas (opcional: filtrar por user_id)
- `GET /tasks/{task_id}` - Obter tarefa específica
- `PUT /tasks/{task_id}` - Atualizar tarefa
- `DELETE /tasks/{task_id}` - Deletar tarefa

### Projetos
- `POST /projects` - Criar projeto
- `GET /projects` - Listar projetos (opcional: filtrar por user_id)
- `GET /projects/{project_id}` - Obter projeto específico
- `PUT /projects/{project_id}` - Atualizar projeto
- `DELETE /projects/{project_id}` - Deletar projeto

### Estatísticas
- `GET /stats` - Estatísticas gerais da aplicação

## 🛠️ Instalação e Execução

1. **Instalar dependências:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Executar a API:**
   ```bash
   python main.py
   ```

   Ou com uvicorn:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Acessar documentação:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📊 Estrutura do Banco de Dados

### Users
- id (TEXT, PRIMARY KEY)
- name (TEXT)
- email (TEXT, UNIQUE)
- created_at (TEXT)

### Tasks
- id (TEXT, PRIMARY KEY)
- title (TEXT)
- description (TEXT)
- completed (BOOLEAN)
- user_id (TEXT, FOREIGN KEY)
- created_at (TEXT)
- updated_at (TEXT)

### Projects
- id (TEXT, PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- status (TEXT)
- user_id (TEXT, FOREIGN KEY)
- created_at (TEXT)
- updated_at (TEXT)

## 🔧 Configuração

O arquivo `.env` contém as variáveis de ambiente:
- `API_HOST`: Host da API (default: 0.0.0.0)
- `API_PORT`: Porta da API (default: 8000)
- `DEBUG`: Modo debug (default: True)
- `DATABASE_URL`: URL do banco de dados
- `SECRET_KEY`: Chave para segurança

## 🌐 CORS

A API está configurada para aceitar requisições do frontend em desenvolvimento:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

## 📝 Exemplo de Uso

### Criar Usuário
```bash
curl -X POST "http://localhost:8000/users" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "João Silva",
       "email": "joao@example.com"
     }'
```

### Criar Tarefa
```bash
curl -X POST "http://localhost:8000/tasks" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Estudar FastAPI",
       "description": "Completar tutorial oficial",
       "user_id": "user-id-here"
     }'
```

## 🚀 Deploy

Para produção, considere:
- Usar PostgreSQL ou MySQL em vez de SQLite
- Configurar variáveis de ambiente adequadamente
- Implementar autenticação JWT completa
- Adicionar logging e monitoramento
- Configurar HTTPS
