# Relatório de Desenvolvimento — Sistema LARM Materiais

Documento para uso no relatório final do estágio supervisionado, descrevendo fases, entregas e mudanças do projeto.

## 1. Contexto e objetivo

O estágio envolveu o desenvolvimento de um sistema web de gestão acadêmica e de laboratório (LARM Materiais), voltado ao acompanhamento de:

- Pessoas (alunos, professores e colaboradores)
- Materiais (consumo e permanente) e estoque
- Projetos acadêmicos, com atividades, reuniões e cronograma

O sistema foi construído em arquitetura cliente-servidor, com frontend em React e backend em FastAPI, banco PostgreSQL e deploy via Docker.

**Objetivo geral:** centralizar informações do laboratório e dos projetos em uma única plataforma, com autenticação, perfis de acesso distintos e interface moderna.

---

## 2. Tecnologias utilizadas

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI** | Tailwind CSS, Radix UI, componentes shadcn/ui, Lucide Icons |
| **Gráficos** | Recharts (dashboard), Gantt customizado (date-fns) |
| **Backend** | Python 3, FastAPI |
| **Banco de dados** | PostgreSQL |
| **Autenticação** | JWT (Bearer token), bcrypt para senhas |
| **Deploy** | Docker, Docker Compose (backend, frontend, PostgreSQL, Redis) |
| **Documentação API** | Swagger/OpenAPI (/docs) |

**Dependências Backend:**
- FastAPI 0.104.1+
- Uvicorn 0.24.0+ (servidor ASGI)
- Pydantic 2.8.0+ (validação de dados)
- psycopg2-binary 2.9.7+ (driver PostgreSQL)
- passlib[bcrypt] 1.7.4+ (hash de senhas)
- python-jose 3.3.0+ (JWT tokens)
- python-dotenv 1.0.0+ (variáveis de ambiente)

**Dependências Frontend:**
- React 18.3.1
- Vite 6.3.5
- TailwindCSS 4.1.12
- Radix UI (componentes acessíveis)
- shadcn/ui (componentes estilizados)
- Material UI 7.3.5
- Lucide React 0.487.0 (ícones)
- Recharts 2.15.2 (gráficos)
- React Router 7.13.0 (roteamento)
- gantt-task-react (cronograma)

---

## 3. Arquitetura do sistema

```
┌─────────────────┐     HTTP/REST + JWT     ┌─────────────────┐
│  Lab_Front      │ ◄──────────────────────► │  Lab_back       │
│  (React/Vite)   │                          │  (FastAPI)      │
│  Porta 3000/5173│                          │  Porta 8000     │
└─────────────────┘                          └────────┬────────┘
                                                        │
                                               ┌────────▼────────┐
                                               │  PostgreSQL     │
                                               │  (dados)        │
                                               └─────────────────┘
```

**Módulos principais do frontend:**
- Dashboard — visão geral e estatísticas
- People — gestão de pessoas (professor)
- Materials / Stock — materiais e estoque
- Projetos — listagem e gestão de projetos
- ProjectDetails — detalhes, resumo e Gantt
- ProjectBoard — quadro Kanban e atas de reunião
- Login / Register — autenticação

**Módulos principais do backend:**
- Autenticação (/auth/*)
- CRUD de alunos, professores e colaboradores
- CRUD de materiais (consumo e permanente)
- CRUD de projetos, atividades e reuniões
- Endpoint de estatísticas (/stats)

---

## 4. Fases do projeto (cronologia)

### Fase 1 — Inicialização (abril/2026)
**Commit:** Initial commit (06/04/2026)

Criação do repositório e estrutura base do projeto.

### Fase 2 — Implementação do sistema completo (abril/2026)
**Commit:** Subindo tudo e esta funcionando (07/04/2026)

**Entregas:**
- Frontend React/Vite com interface responsiva e tema claro/escuro
- Backend FastAPI com endpoints REST
- Módulos de pessoas, materiais, estoque, projetos e dashboard
- Integração frontend ↔ backend via serviço api.ts
- Sidebar de navegação e fluxo entre telas

**Funcionalidades iniciais:**
- Cadastro e listagem de alunos, professores e colaboradores
- Gestão de material de consumo e permanente
- Controle de estoque com alertas de quantidade baixa
- CRUD de projetos (nome, status, coordenador, membros, datas)
- Tela de detalhes do projeto com resumo de atividades e reuniões

### Fase 3 — Ajustes e refinamentos (abril/2026)
**Commit:** Ajustes pedido 1.2 (21/04/2026)

Correções e melhorias solicitadas na supervisão (pedido 1.2)
Ajustes de interface e comportamento conforme feedback do orientador

### Fase 4 — Containerização e deploy (maio–junho/2026)
**Commits:** Terminando, dockerizei já (06/05/2026) e config docker, tudo ok (08/06/2026)

**Entregas:**
- docker-compose.yml com 4 serviços:
  - backend (FastAPI)
  - frontend (React servido em nginx)
  - db (PostgreSQL 15)
  - redis (cache, opcional)
- Dockerfiles para backend e frontend
- Variáveis de ambiente (CORS, JWT, conexão com banco)
- vercel.json para possível deploy do backend
- Migração de banco: SQLite (documentação antiga) → PostgreSQL em produção/desenvolvimento containerizado

**Detalhes da Dockerização:**

**Backend (Lab_back/Dockerfile):**
- Base: python:3.11-slim
- Instalação de dependências do requirements.txt
- Exposição da porta 8000
- Execução com Uvicorn

**Frontend (Lab_Front/Dockerfile):**
- Multi-stage build
- Build stage: node:18-alpine (compilação)
- Production stage: nginx:alpine (servidor)
- Configuração otimizada do Nginx
- Exposição da porta 80

**Configurações de Rede:**
- Network: lab_network (driver: bridge)
- Volumes persistentes: postgres_data, redis_data

### Fase 5 — Autenticação e perfis de usuário (desenvolvimento contínuo)
**Entregas:**
- Tela de Login e Register
- Registro com três perfis: aluno, professor, colaborador
- Token JWT armazenado no localStorage
- Endpoint /auth/me para dados do usuário logado
- Proteção de rotas no backend com Depends(get_current_user)

**Implementação Técnica:**
- HTTPBearer para segurança das rotas
- Geração de tokens JWT com expiração configurável
- Tokens de acesso: 30 minutos de validade
- Tokens de refresh: 7 dias de validade
- Criptografia de senhas com bcrypt (12 rounds)
- Variáveis de ambiente: SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

### Fase 6 — Gestão de projetos avançada (desenvolvimento contínuo)
**Entregas:**

**6.1 Quadro Kanban (ProjectBoard)**
- Colunas: Backlog → To Do → Doing → Done
- Criação, edição e exclusão de atividades
- Arrastar e soltar entre colunas
- Atribuição de responsável e data de conclusão
- Aba de Atas Registradas (reuniões concluídas)

**6.2 Cronograma Gantt (GanttChart)**
- Visualização temporal das atividades do projeto
- Cores e ícones por status
- Janela de 4 meses (2 antes e 2 depois da data atual)
- Reuniões exibidas como marcos (milestone)

**6.3 Detalhes do projeto (ProjectDetails)**
- Cards de resumo (total, concluídas, em andamento, reuniões)
- Informações do projeto (coordenador, membros, datas)
- Botão de acesso ao quadro de atividades/reuniões
- Integração com Gantt

### Fase 7 — Correções de usabilidade (maio/2026)
**Problemas identificados e corrigidos:**

| Problema | Solução |
|----------|---------|
| Ao fechar o quadro de atividades, o sistema voltava para a lista de projetos | Navegação com returnTo: fecha o quadro e retorna à tela do projeto |
| Arrastar atividade entre colunas não persistia | updateTaskStatus passou a chamar a API; reversão em caso de erro |
| Gantt não atualizava após mudança de status | Recarregamento dos dados ao voltar aos detalhes do projeto |

### Fase 8 — Reuniões como tipo de atividade (maio/2026)
**Conceito:** reunião deixa de ser só um registro isolado e passa a ser uma atividade do tipo reuniao, com fluxo no Kanban.

**Implementação:**

**Backend:**
- Campos tipo (tarefa | reuniao) e reuniao_id em projeto_atividades
- Campo atividade_id em projeto_reunioes
- Migração automática no init_db para bancos existentes

**Frontend:**
- Seletor de tipo ao criar atividade
- Badge visual "Reunião" nos cards
- Ao mover para Done, abre modal Registrar Reunião (ata)
- Só após salvar a ata a atividade fica concluída
- Botões "Registrar" e "Ver Ata" nos cards
- Gantt trata reuniões como marcos

**Fluxo:**
Criar atividade tipo Reunião → Backlog/To Do/Doing → Done → Modal de ata → Concluída + registrada

### Fase 9 — Controle de acesso por perfil (RBAC) (maio/2026)
**Análise inicial:** regras de permissão existiam parcialmente no backend; atividades e reuniões estavam sem autenticação; frontend mostrava as mesmas ações para todos.

**Implementação no backend:**

**Funções auxiliares:**
- is_project_member — verifica participação (ID ou nome, compatível com dados antigos)
- can_create_activity, can_edit_activity, can_delete_activity
- can_manage_reuniao, validate_coordenador_is_professor
- require_project_view, require_project_member

**Matriz de permissões implementada:**

| Recurso | Aluno | Professor | Colaborador |
|---------|-------|-----------|-------------|
| Ver projetos | Só onde é membro | Todos | Todos |
| Criar/editar/excluir projeto | Não | Sim | Não |
| Coordenador | Não | Sim (só professor) | Não |
| Ver materiais | Sim (consulta) | Sim | Sim |
| Gerir materiais | Não | Sim | Sim |
| Criar atividade | Projeto membro | Sim | Projeto membro |
| Editar atividade | Só próprias | Todas | Do projeto (membro) |
| Excluir atividade | Só próprias | Todas | Não |
| Registrar/editar reunião | Se membro | Sim | Se membro |
| Excluir reunião | Não | Sim | Não |
| Gerir pessoas | Não | Sim | Não |

**Implementação no frontend:**
- Hook usePermissions centralizando regras da UI
- Sidebar adaptada por perfil (aluno não vê "Pessoas")
- Botões criar/editar/excluir condicionados ao perfil
- Aluno: responsável fixo em si nas atividades
- Professor: gestão completa de projetos e pessoas
- Membros do projeto salvos por ID de perfil (com compatibilidade para nomes antigos)

### Fase 10 — Migrações de banco de dados e scripts de utilidade

**Migration 1: Constraint de Tipo de Usuário**
- Arquivo: `migrations/add_admin_to_check_constraint.sql`
- Objetivo: Adicionar 'administrador' à constraint check da tabela usuarios
- Alteração: Incluir tipo 'administrador' na enumeração de tipos de usuário
- Tipos suportados: aluno, professor, colaborador, administrador

**Migration 2: Fotos de Perfil**
- Arquivo: `migrations/add_foto_perfil.sql`
- Objetivo: Adicionar campo foto_perfil em todas as tabelas de usuários
- Tabelas alteradas: alunos, professores, colaboradores, administradores
- Tipo do campo: VARCHAR(255)

**Migration 3: Usuário Administrador Padrão**
- Arquivo: `migrations/create_admin_user.sql`
- Objetivo: Criar usuário administrador inicial para o sistema
- Credenciais padrão: Email: admin@lab.com, Senha: admin123 (hash bcrypt)
- Inserção segura com ON CONFLICT para evitar duplicatas

**Scripts de Utilidade:**
- `Lab_back/setup_database.py`: Criação inicial das tabelas
- `Lab_back/create_admin.py`: Criação de usuário administrador
- `Lab_back/clear_database.py`: Limpeza de dados (desenvolvimento)
- `Lab_back/run.py`: Execução simplificada da API

---

## 5. Estrutura de dados principal

### Tabelas do banco (PostgreSQL)

| Tabela | Descrição |
|--------|-----------|
| usuarios | Autenticação (email, senha, tipo, perfil_id) |
| alunos | Dados de alunos |
| professores | Dados de professores |
| colaboradores | Dados de colaboradores |
| material_consumo | Materiais consumíveis |
| material_permanente | Materiais patrimoniais |
| projetos | Projetos acadêmicos |
| projeto_atividades | Atividades Kanban (com tipo, status, reuniao_id) |
| projeto_reunioes | Atas de reunião (com atividade_id) |

**Estrutura da tabela usuarios (autenticação):**
- id: UUID (PRIMARY KEY)
- email: TEXT (UNIQUE)
- password_hash: TEXT (bcrypt)
- tipo_usuario: TEXT (aluno/professor/colaborador/administrador)
- perfil_id: UUID (FOREIGN KEY)
- data_cadastro: TIMESTAMP

**Status de atividades (Kanban):**
backlog → todo → doing → done

**Status de projetos:**
planejamento, em_andamento, pausado, concluido, cancelado

---

## 6. Telas e funcionalidades por módulo

### Dashboard
- Estatísticas gerais (pessoas, materiais, projetos)
- Gráficos de distribuição
- Visão consolidada do laboratório

### Pessoas (apenas professor)
- Abas: Alunos, Professores, Colaboradores
- CRUD com busca e filtros
- Detalhes da pessoa com projetos e atividades

### Materiais
- Material de consumo e permanente
- Busca por tipo, descrição, patrimônio
- Aluno: modo consulta; professor/colaborador: gestão completa

### Estoque
- Visão de quantidades
- Filtros: todos, estoque baixo, estoque ok
- Alertas visuais para itens críticos

### Projetos
- Listagem com filtros por status
- Formulário com coordenador (só professor) e membros
- Acesso a detalhes e quadro Kanban
- Aluno: só projetos em que participa, sem botões de gestão

### Detalhes do projeto
- Resumo de atividades e reuniões
- Cronograma Gantt
- Acesso ao quadro de atividades/reuniões

### Quadro de atividades (ProjectBoard)
- Kanban com drag-and-drop
- Tipos: Tarefa e Reunião
- Registro de ata ao concluir reunião
- Aba de atas registradas

---

## 7. Desafios técnicos e soluções

| Desafio | Solução adotada |
|---------|-----------------|
| Membros do projeto não filtravam corretamente para alunos | Comparação por perfil_id e nome (legado) |
| Atividades sem autenticação na API | Depends(get_current_user) em todos os endpoints |
| UI igual para todos os perfis | Hook usePermissions + renderização condicional |
| Conflito de nome User (ícone vs tipo) | Import como AuthUser no TypeScript |
| Drag-and-drop sem persistência | Atualização otimista + chamada PUT à API |
| Reunião desconectada do fluxo de trabalho | Tipo reuniao no Kanban com modal de ata em Done |

---

## 8. Como executar o projeto

### Desenvolvimento local
```bash
# Backend
cd Lab_back
pip install -r requirements.txt
python run.py

# Frontend
cd Lab_Front
npm install
npm run dev
```

### Docker (produção/desenvolvimento)
```bash
docker-compose up -d
```

**Acessos:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 9. Resultados alcançados

- Sistema web funcional para gestão do laboratório acadêmico
- Autenticação com três perfis e regras de acesso
- Gestão de projetos com Kanban, Gantt e reuniões integradas
- Interface responsiva com tema claro/escuro
- Deploy containerizado com Docker Compose
- API documentada via Swagger
- Correções de usabilidade e persistência de dados
- Modelo de reunião integrado ao fluxo de atividades

---

## 10. Trabalhos futuros sugeridos

- Migrar projetos antigos para membros apenas por ID
- Testes automatizados (backend e frontend)
- Notificações (e-mail ou in-app) para prazos e reuniões
- Exportação de relatórios em PDF
- Refresh token automático no frontend
- Auditoria de ações (log de quem alterou o quê)
- Deploy em servidor institucional com HTTPS
- Sistema de empréstimo de materiais
- Integração com outros sistemas acadêmicos

---

## 11. Conclusão

O estágio resultou no desenvolvimento de um sistema completo de gestão acadêmica e de laboratório, evoluindo desde a estrutura inicial (abril/2026) até um produto com autenticação, controle de acesso por perfil, gestão de projetos com Kanban e Gantt, reuniões como atividades e deploy em Docker.

As fases cobriram: implementação base → refinamentos → containerização → autenticação → gestão avançada de projetos → correções de UX → integração de reuniões → RBAC completo.

O sistema atende ao objetivo de centralizar pessoas, materiais e projetos em uma plataforma única, com permissões adequadas para alunos, professores e colaboradores.

---

## Referências

- Documentação FastAPI: https://fastapi.tiangolo.com/
- Documentação React: https://react.dev/
- Documentação Docker: https://docs.docker.com/
- Design original no Figma: https://www.figma.com/design/ASwcpsmrNAGztaPeS1d0lB/ERP-para-gest%C3%A3o-de-materiais
