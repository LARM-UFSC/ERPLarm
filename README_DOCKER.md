# Dockerização do Sistema Lab

## 🐳 Estrutura do Projeto Dockerizado

```
Estagio/
├── Lab_back/              # Backend FastAPI
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── Lab_Front/             # Frontend React/Vite
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml     # Orquestração dos serviços
├── .env                   # Variáveis de ambiente
├── .dockerignore          # Arquivos ignorados pelo Docker
└── init.sql              # Script de inicialização do DB
```

## 🚀 Como Executar

### Pré-requisitos
- Docker Desktop instalado
- Docker Compose

### Passos para Iniciar

1. **Clonar o repositório e navegar até a pasta**
   ```bash
   cd /Users/mac/Documents/2026.1/Estagio/Estagio
   ```

2. **Configurar variáveis de ambiente**
   ```bash
   # O arquivo .env já está configurado, mas verifique se necessário
   cat .env
   ```

3. **Construir e iniciar os containers**
   ```bash
   # Construir e iniciar todos os serviços
   docker-compose up --build
   
   # Ou em modo detached (background)
   docker-compose up --build -d
   ```

4. **Acessar as aplicações**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs
   - **Banco de Dados**: localhost:5432
   - **Redis**: localhost:6379

## 📋 Serviços Disponíveis

### 1. Backend (FastAPI)
- **Container**: `lab_backend`
- **Porta**: 8000
- **Funcionalidade**: API REST completa
- **Dependências**: PostgreSQL, Redis

### 2. Frontend (React/Vite + Nginx)
- **Container**: `lab_frontend`
- **Porta**: 3000
- **Funcionalidade**: Aplicação web servida pelo Nginx
- **Dependências**: Backend

### 3. Banco de Dados (PostgreSQL)
- **Container**: `lab_db`
- **Porta**: 5432
- **Funcionalidade**: Armazenamento de dados
- **Volume**: `postgres_data` (persistente)

### 4. Cache (Redis)
- **Container**: `lab_redis`
- **Porta**: 6379
- **Funcionalidade**: Cache e sessões
- **Volume**: `redis_data` (persistente)

## 🛠️ Comandos Úteis

### Gerenciamento dos Containers
```bash
# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f          # Todos os serviços
docker-compose logs -f backend  # Apenas backend
docker-compose logs -f frontend # Apenas frontend

# Parar os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reconstruir apenas um serviço
docker-compose up --build backend

# Executar comandos dentro do container
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Desenvolvimento
```bash
# Iniciar apenas o banco de dados
docker-compose up -d db

# Iniciar backend em modo desenvolvimento
docker-compose up --build backend

# Limpar tudo e reconstruir
docker-compose down -v --rmi all
docker-compose up --build
```

## 🔧 Configurações

### Variáveis de Ambiente (.env)
- `DATABASE_URL`: URL de conexão com PostgreSQL
- `CORS_ORIGINS`: Origens permitidas para CORS
- `VITE_API_URL`: URL da API para o frontend
- `POSTGRES_*`: Configurações do PostgreSQL

### Portas
- **3000**: Frontend (Nginx)
- **8000**: Backend (FastAPI)
- **5432**: PostgreSQL
- **6379**: Redis

### Volumes Persistentes
- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis

## 🐛 Troubleshooting

### Problemas Comuns

1. **Porta já em uso**
   ```bash
   # Verificar qual processo está usando a porta
   lsof -i :3000
   lsof -i :8000
   
   # Matar o processo
   kill -9 <PID>
   ```

2. **Permissões de arquivo**
   ```bash
   # Garantir permissões corretas
   chmod -R 755 .
   ```

3. **Cache do Docker**
   ```bash
   # Limpar cache do Docker
   docker system prune -a
   ```

4. **Reconstruir sem cache**
   ```bash
   docker-compose build --no-cache
   ```

### Logs e Debug
```bash
# Ver logs em tempo real
docker-compose logs -f

# Logs específicos
docker-compose logs backend | grep ERROR

# Acessar o container para debug
docker-compose exec backend python -c "import os; print(os.environ)"
```

## 📁 Estrutura dos Dockerfiles

### Backend (Lab_back/Dockerfile)
- Base: `python:3.11-slim`
- Instala dependências do `requirements.txt`
- Expõe porta 8000
- Executa com Uvicorn

### Frontend (Lab_Front/Dockerfile)
- Multi-stage build
- Build stage: `node:18-alpine` (para compilação)
- Production stage: `nginx:alpine` (para servir)
- Configuração otimizada do Nginx
- Expõe porta 80 (mapeada para 3000)

## 🔐 Segurança

- Senhas e chaves estão no `.env` (não commitadas)
- CORS configurado para origens específicas
- Nginx com headers de segurança
- Containers rodando como usuário não-root quando possível

## 🚀 Produção

Para deploy em produção:
1. Alterar senhas no `.env`
2. Configurar HTTPS (certificados)
3. Ajustar recursos dos containers
4. Configurar backup automático do banco
5. Monitoramento e logging centralizado
