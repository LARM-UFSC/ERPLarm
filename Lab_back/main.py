from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
import psycopg2.extras
import json
from datetime import datetime, timedelta
import uuid
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
import bcrypt
from jose import JWTError, jwt

# Carregar variáveis de ambiente
load_dotenv()

app = FastAPI(
    title="Lab API",
    description="API completa para servir o Frontend",
    version="1.0.0"
)

# Configuração CORS
# Ler origens permitidas das variáveis de ambiente ou usar valores padrão
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:80").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Segurança
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# Configurações JWT
SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-super-segura-mude-em-producao")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Modelos Pydantic para Sistema Acadêmico
class Aluno(BaseModel):
    id: Optional[str] = None
    nome: str
    matricula: str
    curso: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    foto_perfil: Optional[str] = None
    data_cadastro: Optional[datetime] = None

class Professor(BaseModel):
    id: Optional[str] = None
    nome: str
    matricula: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    foto_perfil: Optional[str] = None
    data_cadastro: Optional[datetime] = None

class Colaborador(BaseModel):
    id: Optional[str] = None
    nome: str
    cpf: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    foto_perfil: Optional[str] = None
    data_cadastro: Optional[datetime] = None

class Administrador(BaseModel):
    id: Optional[str] = None
    nome: str
    cpf: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    foto_perfil: Optional[str] = None
    data_cadastro: Optional[datetime] = None

class MaterialConsumo(BaseModel):
    id: Optional[str] = None
    tipo: str
    descricao: str
    quantidade: int
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

class MaterialPermanente(BaseModel):
    id: Optional[str] = None
    tipo: str
    patrimonio: str
    modelo: Optional[str] = None
    marca: Optional[str] = None
    descricao: Optional[str] = None
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

class Projeto(BaseModel):
    id: Optional[str] = None
    nome: str
    descricao: Optional[str] = None
    status: str
    coordenador: str
    membros: Optional[str] = None
    data_inicio: str
    data_previsao: str
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

class ProjetoAtividade(BaseModel):
    id: Optional[str] = None
    projeto_id: Optional[str] = None
    titulo: str
    descricao: Optional[str] = None
    tipo: str = 'tarefa'  # 'tarefa' | 'reuniao'
    status: str = 'backlog'
    responsavel: Optional[str] = None
    data_conclusao: Optional[str] = None
    reuniao_id: Optional[str] = None
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

class ProjetoReuniao(BaseModel):
    id: Optional[str] = None
    projeto_id: Optional[str] = None
    atividade_id: Optional[str] = None
    titulo: str
    data_reuniao: str
    participantes: Optional[str] = None
    pauta: Optional[str] = None
    resumo: Optional[str] = None
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

# Modelos de Autenticação
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    tipo_usuario: str  # 'aluno', 'professor', 'colaborador', 'administrador'
    nome: str
    matricula: Optional[str] = None  # para aluno e professor
    curso: Optional[str] = None  # para aluno
    cpf: Optional[str] = None  # para colaborador e administrador
    telefone: Optional[str] = None

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_type: str
    user_id: str
    nome: str
    perfil_id: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class User(BaseModel):
    id: str
    email: str
    tipo_usuario: str
    perfil_id: Optional[str] = None  # ID do aluno/professor/colaborador associado
    nome: Optional[str] = None
    foto_perfil: Optional[str] = None

# Banco de dados PostgreSQL
def get_db_connection():
    try:
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            conn = psycopg2.connect(database_url)
        else:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', '5432'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', '12345678'),
                database=os.getenv('DB_NAME', 'lab')
            )
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        raise HTTPException(status_code=500, detail="Erro de conexão com o banco de dados")

# Funções auxiliares de autenticação
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except:
        return False

def get_password_hash(password: str) -> str:
    # bcrypt automaticamente trunca senhas maiores que 72 bytes
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        if user_id is None or user_type is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE id = %s", (user_id,))
    user_data = cursor.fetchone()
    conn.close()
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    columns = ['id', 'email', 'password_hash', 'tipo_usuario', 'perfil_id', 'data_cadastro']
    user_dict = dict(zip(columns, user_data))
    
    return User(
        id=user_dict['id'],
        email=user_dict['email'],
        tipo_usuario=user_dict['tipo_usuario'],
        perfil_id=user_dict['perfil_id']
    )

# Funções de verificação de permissões
def require_professor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.tipo_usuario != "professor":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas professores podem acessar este recurso.")
    return current_user

def require_aluno(current_user: User = Depends(get_current_user)) -> User:
    if current_user.tipo_usuario != "aluno":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas alunos podem acessar este recurso.")
    return current_user

def require_colaborador(current_user: User = Depends(get_current_user)) -> User:
    if current_user.tipo_usuario != "colaborador":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas colaboradores podem acessar este recurso.")
    return current_user

def require_administrador(current_user: User = Depends(get_current_user)) -> User:
    if current_user.tipo_usuario != "administrador":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores podem acessar este recurso.")
    return current_user

def require_professor_or_colaborador(current_user: User = Depends(get_current_user)) -> User:
    if current_user.tipo_usuario not in ["professor", "colaborador"]:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas professores ou colaboradores podem acessar este recurso.")
    return current_user

def require_professor_colaborador_or_administrador(current_user: User = Depends(get_current_user)) -> User:
    if current_user.tipo_usuario not in ["professor", "colaborador", "administrador"]:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas professores, colaboradores ou administradores podem acessar este recurso.")
    return current_user

def require_self_or_admin():
    """Permite que o usuário acesse seu próprio recurso ou que administradores acessem qualquer recurso"""
    def check(current_user: User = Depends(get_current_user)):
        # Administradores podem acessar qualquer recurso
        if current_user.tipo_usuario == "administrador":
            return current_user
        return current_user
    return check

def parse_membros_list(membros: Optional[str]) -> List[str]:
    if not membros:
        return []
    return [m.strip() for m in membros.split(",") if m.strip()]


def get_user_nome(current_user: User, cursor=None) -> str:
    if not current_user.perfil_id:
        return current_user.nome or ""
    close_conn = False
    if cursor is None:
        conn = get_db_connection()
        cursor = conn.cursor()
        close_conn = True
    if current_user.tipo_usuario == "aluno":
        cursor.execute("SELECT nome FROM alunos WHERE id = %s", (current_user.perfil_id,))
    elif current_user.tipo_usuario == "professor":
        cursor.execute("SELECT nome FROM professores WHERE id = %s", (current_user.perfil_id,))
    elif current_user.tipo_usuario == "colaborador":
        cursor.execute("SELECT nome FROM colaboradores WHERE id = %s", (current_user.perfil_id,))
    elif current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT nome FROM administradores WHERE id = %s", (current_user.perfil_id,))
    else:
        if close_conn:
            conn.close()
        return current_user.nome or ""
    row = cursor.fetchone()
    if close_conn:
        conn.close()
    return row[0] if row else (current_user.nome or "")


def get_user_foto_perfil(current_user: User, cursor=None) -> Optional[str]:
    if not current_user.perfil_id:
        return None
    close_conn = False
    if cursor is None:
        conn = get_db_connection()
        cursor = conn.cursor()
        close_conn = True
    if current_user.tipo_usuario == "aluno":
        cursor.execute("SELECT foto_perfil FROM alunos WHERE id = %s", (current_user.perfil_id,))
    elif current_user.tipo_usuario == "professor":
        cursor.execute("SELECT foto_perfil FROM professores WHERE id = %s", (current_user.perfil_id,))
    elif current_user.tipo_usuario == "colaborador":
        cursor.execute("SELECT foto_perfil FROM colaboradores WHERE id = %s", (current_user.perfil_id,))
    elif current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT foto_perfil FROM administradores WHERE id = %s", (current_user.perfil_id,))
    else:
        if close_conn:
            conn.close()
        return None
    row = cursor.fetchone()
    if close_conn:
        conn.close()
    return row[0] if row else None


def enrich_user(current_user: User) -> User:
    nome = get_user_nome(current_user)
    foto_perfil = get_user_foto_perfil(current_user)
    return User(
        id=current_user.id,
        email=current_user.email,
        tipo_usuario=current_user.tipo_usuario,
        perfil_id=current_user.perfil_id,
        nome=nome,
        foto_perfil=foto_perfil,
    )


def is_project_member(current_user: User, projeto: dict, nome: Optional[str] = None) -> bool:
    membros = parse_membros_list(projeto.get("membros"))
    if not membros:
        return False
    if current_user.perfil_id and current_user.perfil_id in membros:
        return True
    if nome is None:
        nome = get_user_nome(current_user)
    return bool(nome and nome in membros)


def check_project_access(current_user: User, projeto_id: str) -> bool:
    """Visualização de projeto: administrador veem todos; professor/colaborador só se coordenador ou membro; aluno só se membro."""
    if current_user.tipo_usuario == "administrador":
        return True
    if current_user.tipo_usuario in ["professor", "colaborador"]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projetos WHERE id = %s", (projeto_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False
        projeto = dict_from_row(cursor, row)
        conn.close()
        return is_project_coordenador(current_user, projeto) or is_project_member(current_user, projeto)
    if current_user.tipo_usuario == "aluno":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projetos WHERE id = %s", (projeto_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False
        projeto = dict_from_row(cursor, row)
        conn.close()
        return is_project_member(current_user, projeto)
    return False


def get_projeto_dict(projeto_id: str) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projetos WHERE id = %s", (projeto_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    projeto = dict_from_row(cursor, row)
    conn.close()
    return projeto


def require_project_view(current_user: User, projeto_id: str) -> dict:
    projeto = get_projeto_dict(projeto_id)
    if not check_project_access(current_user, projeto_id):
        raise HTTPException(status_code=403, detail="Acesso negado a este projeto")
    return projeto


def require_project_member(current_user: User, projeto: dict) -> None:
    if current_user.tipo_usuario == "administrador":
        return
    if current_user.tipo_usuario in ["professor", "colaborador"]:
        if is_project_coordenador(current_user, projeto):
            return
    if current_user.tipo_usuario == "aluno":
        if is_project_member(current_user, projeto):
            return
    raise HTTPException(
        status_code=403,
        detail="Acesso negado. Você precisa ser membro ou coordenador deste projeto.",
    )


def validate_coordenador_is_professor(coordenador: str) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM professores WHERE nome = %s", (coordenador,))
    found = cursor.fetchone()
    if not found:
        cursor.execute("SELECT id FROM colaboradores WHERE nome = %s", (coordenador,))
        found = cursor.fetchone()
    if not found:
        cursor.execute("SELECT id FROM administradores WHERE nome = %s", (coordenador,))
        found = cursor.fetchone()
    conn.close()
    if not found:
        raise HTTPException(
            status_code=400,
            detail="O coordenador deve ser um professor, colaborador ou administrador cadastrado.",
        )


def is_project_coordenador(current_user: User, projeto: dict) -> bool:
    """Verifica se o usuário é o coordenador do projeto."""
    nome_usuario = get_user_nome(current_user)
    coordenador = (projeto.get("coordenador") or "").strip()
    return coordenador == nome_usuario


def can_manage_materials(current_user: User) -> bool:
    return current_user.tipo_usuario == "administrador"


def can_create_activity(current_user: User, projeto: dict) -> bool:
    if current_user.tipo_usuario == "administrador":
        return True
    if current_user.tipo_usuario in ["professor", "colaborador"]:
        return is_project_coordenador(current_user, projeto)
    if current_user.tipo_usuario == "aluno":
        return is_project_member(current_user, projeto)
    return False


def can_edit_activity(current_user: User, atividade: dict, projeto: dict) -> bool:
    if current_user.tipo_usuario == "administrador":
        return True
    if current_user.tipo_usuario in ["professor", "colaborador"]:
        return is_project_coordenador(current_user, projeto)
    if not is_project_member(current_user, projeto):
        return False
    if current_user.tipo_usuario == "aluno":
        nome = get_user_nome(current_user)
        responsavel = (atividade.get("responsavel") or "").strip()
        return responsavel == nome
    return False


def can_delete_activity(current_user: User, atividade: dict, projeto: dict) -> bool:
    if current_user.tipo_usuario == "administrador":
        return True
    if current_user.tipo_usuario in ["professor", "colaborador"]:
        return is_project_coordenador(current_user, projeto)
    if current_user.tipo_usuario == "aluno":
        if not is_project_member(current_user, projeto):
            return False
        nome = get_user_nome(current_user)
        return (atividade.get("responsavel") or "").strip() == nome
    return False


def can_manage_reuniao(current_user: User, projeto: dict) -> bool:
    """Registro/edição de atas: administrador, coordenador (professor/colaborador) ou membro do projeto (aluno)."""
    if current_user.tipo_usuario == "administrador":
        return True
    if current_user.tipo_usuario in ["professor", "colaborador"]:
        return is_project_coordenador(current_user, projeto)
    return is_project_member(current_user, projeto)


def forbid_aluno_material_write(current_user: User) -> None:
    if current_user.tipo_usuario == "aluno":
        raise HTTPException(
            status_code=403,
            detail="Alunos não podem gerenciar materiais.",
        )

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Tabela de usuários (autenticação)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usuarios (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('aluno', 'professor', 'colaborador', 'administrador')),
                perfil_id TEXT,
                refresh_token TEXT,
                deleted_at TIMESTAMP,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabela de alunos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alunos (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                matricula TEXT UNIQUE NOT NULL,
                curso TEXT NOT NULL,
                telefone TEXT,
                email TEXT,
                deleted_at TIMESTAMP,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Tabela de professores
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS professores (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                matricula TEXT UNIQUE NOT NULL,
                telefone TEXT,
                email TEXT,
                deleted_at TIMESTAMP,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Tabela de colaboradores
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS colaboradores (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                cpf TEXT UNIQUE NOT NULL,
                telefone TEXT,
                email TEXT,
                deleted_at TIMESTAMP,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Tabela de administradores
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS administradores (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                cpf TEXT UNIQUE NOT NULL,
                telefone TEXT,
                email TEXT,
                deleted_at TIMESTAMP,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Tabela de material_consumo
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS material_consumo (
                id TEXT PRIMARY KEY,
                tipo TEXT NOT NULL,
                descricao TEXT NOT NULL,
                quantidade INTEGER NOT NULL,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP
            )
        ''')
        
        # Tabela de material_permanente
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS material_permanente (
                id TEXT PRIMARY KEY,
                tipo TEXT NOT NULL,
                patrimonio TEXT UNIQUE NOT NULL,
                modelo TEXT,
                marca TEXT,
                descricao TEXT,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP
            )
        ''')

        # Tabela de projetos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projetos (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                descricao TEXT,
                status TEXT NOT NULL,
                coordenador TEXT NOT NULL,
                membros TEXT,
                data_inicio TEXT NOT NULL,
                data_previsao TEXT NOT NULL,
                deleted_at TIMESTAMP,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP
            )
        ''')

        # Tabela de atividades do projeto (Kanban)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projeto_atividades (
                id TEXT PRIMARY KEY,
                projeto_id TEXT NOT NULL,
                titulo TEXT NOT NULL,
                descricao TEXT,
                tipo TEXT NOT NULL DEFAULT 'tarefa',
                status TEXT NOT NULL DEFAULT 'backlog',
                responsavel TEXT,
                data_conclusao TEXT,
                reuniao_id TEXT,
                deleted_at TIMESTAMP,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP,
                FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
            )
        ''')

        # Tabela de reuniões do projeto
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projeto_reunioes (
                id TEXT PRIMARY KEY,
                projeto_id TEXT NOT NULL,
                atividade_id TEXT,
                titulo TEXT NOT NULL,
                data_reuniao TEXT NOT NULL,
                participantes TEXT,
                pauta TEXT,
                resumo TEXT,
                deleted_at TIMESTAMP,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP,
                FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
            )
        ''')

        # Migração para bancos existentes
        cursor.execute("ALTER TABLE projeto_atividades ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'tarefa'")
        cursor.execute("ALTER TABLE projeto_atividades ADD COLUMN IF NOT EXISTS reuniao_id TEXT")
        cursor.execute("ALTER TABLE projeto_reunioes ADD COLUMN IF NOT EXISTS atividade_id TEXT")

        # Migração para refresh_token e deleted_at
        cursor.execute("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS refresh_token TEXT")
        cursor.execute("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP")
        cursor.execute("ALTER TABLE alunos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP")
        cursor.execute("ALTER TABLE professores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP")
        cursor.execute("ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP")
        cursor.execute("ALTER TABLE administradores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP")
        cursor.execute("ALTER TABLE projetos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP")
        cursor.execute("ALTER TABLE projeto_atividades ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP")
        cursor.execute("ALTER TABLE projeto_reunioes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP")

        print("Banco de dados inicializado com sucesso!")
        conn.close()
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {e}")
        raise

# Funções auxiliares
def dict_from_row(cursor, row):
    if row is None:
        return None
    columns = [desc[0] for desc in cursor.description]
    return dict(zip(columns, row))

# Endpoints
@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"message": "Lab API - FastAPI funcionando!", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# Endpoints de Autenticação
@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    print(f"[REGISTER] Recebendo requisição de registro: {user_data.email}")
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        print("[REGISTER] Verificando se email já existe...")
        # Verificar se email já existe
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            conn.close()
            print("[REGISTER] Email já cadastrado")
            raise HTTPException(status_code=400, detail="Email já cadastrado")

        # Validar campos obrigatórios por tipo de usuário
        if user_data.tipo_usuario == "aluno" and not user_data.matricula:
            conn.close()
            raise HTTPException(status_code=400, detail="Matrícula é obrigatória para alunos")
        if user_data.tipo_usuario == "aluno" and not user_data.curso:
            conn.close()
            raise HTTPException(status_code=400, detail="Curso é obrigatório para alunos")
        if user_data.tipo_usuario == "professor" and not user_data.matricula:
            conn.close()
            raise HTTPException(status_code=400, detail="Matrícula é obrigatória para professores")
        if user_data.tipo_usuario == "colaborador" and not user_data.cpf:
            conn.close()
            raise HTTPException(status_code=400, detail="CPF é obrigatório para colaboradores")
        if user_data.tipo_usuario == "administrador" and not user_data.cpf:
            conn.close()
            raise HTTPException(status_code=400, detail="CPF é obrigatório para administradores")

        # Verificar se matrícula já existe (para alunos e professores)
        if user_data.tipo_usuario in ["aluno", "professor"] and user_data.matricula:
            print(f"[REGISTER] Verificando se matrícula {user_data.matricula} já existe...")
            if user_data.tipo_usuario == "aluno":
                cursor.execute("SELECT id FROM alunos WHERE matricula = %s", (user_data.matricula,))
            else:
                cursor.execute("SELECT id FROM professores WHERE matricula = %s", (user_data.matricula,))
            if cursor.fetchone():
                conn.close()
                print("[REGISTER] Matrícula já cadastrada")
                raise HTTPException(status_code=400, detail="Matrícula já cadastrada")

        # Verificar se CPF já existe (para colaboradores e administradores)
        if user_data.tipo_usuario in ["colaborador", "administrador"] and user_data.cpf:
            print(f"[REGISTER] Verificando se CPF {user_data.cpf} já existe...")
            if user_data.tipo_usuario == "colaborador":
                cursor.execute("SELECT id FROM colaboradores WHERE cpf = %s", (user_data.cpf,))
            else:
                cursor.execute("SELECT id FROM administradores WHERE cpf = %s", (user_data.cpf,))
            if cursor.fetchone():
                conn.close()
                print("[REGISTER] CPF já cadastrado")
                raise HTTPException(status_code=400, detail="CPF já cadastrado")

        print("[REGISTER] Gerando hash de senha...")
        user_id = str(uuid.uuid4())
        
        # Remover espaços extras da senha
        password = user_data.password.strip()
        print(f"[REGISTER] Senha recebida: '{password}' (repr: {repr(password)})")
        print(f"[REGISTER] Tamanho da senha (bytes): {len(password.encode('utf-8'))}")
        
        try:
            password_hash = get_password_hash(password)
            print(f"[REGISTER] Hash gerado com sucesso")
        except Exception as e:
            conn.close()
            print(f"[REGISTER] Erro ao gerar hash: {e}")
            raise HTTPException(status_code=400, detail=f"Erro ao processar senha: {str(e)}")
        data_cadastro = datetime.now()

        print("[REGISTER] Inserindo usuário na tabela de autenticação...")
        # Criar usuário na tabela de autenticação
        cursor.execute(
            "INSERT INTO usuarios (id, email, password_hash, tipo_usuario, data_cadastro) VALUES (%s, %s, %s, %s, %s)",
            (user_id, user_data.email, password_hash, user_data.tipo_usuario, data_cadastro)
        )

        print("[REGISTER] Criando perfil específico...")
        # Criar perfil específico baseado no tipo de usuário
        perfil_id = None
        if user_data.tipo_usuario == "aluno":
            perfil_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO alunos (id, nome, matricula, curso, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (perfil_id, user_data.nome, user_data.matricula, user_data.curso, user_data.telefone, user_data.email, data_cadastro)
            )
        elif user_data.tipo_usuario == "professor":
            perfil_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO professores (id, nome, matricula, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s)",
                (perfil_id, user_data.nome, user_data.matricula, user_data.telefone, user_data.email, data_cadastro)
            )
        elif user_data.tipo_usuario == "colaborador":
            perfil_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO colaboradores (id, nome, cpf, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s)",
                (perfil_id, user_data.nome, user_data.cpf, user_data.telefone, user_data.email, data_cadastro)
            )
        elif user_data.tipo_usuario == "administrador":
            perfil_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO administradores (id, nome, cpf, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s)",
                (perfil_id, user_data.nome, user_data.cpf, user_data.telefone, user_data.email, data_cadastro)
            )

        print("[REGISTER] Atualizando usuário com perfil_id...")
        # Atualizar usuário com perfil_id
        cursor.execute(
            "UPDATE usuarios SET perfil_id = %s WHERE id = %s",
            (perfil_id, user_id)
        )

        conn.commit()

        print("[REGISTER] Gerando token...")
        # Gerar tokens
        access_token = create_access_token(
            data={"sub": user_id, "user_type": user_data.tipo_usuario},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_access_token(
            data={"sub": user_id, "user_type": user_data.tipo_usuario, "type": "refresh"},
            expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )

        # Salvar refresh token no banco
        cursor.execute(
            "UPDATE usuarios SET refresh_token = %s WHERE id = %s",
            (refresh_token, user_id)
        )
        conn.commit()

        conn.close()

        print("[REGISTER] Registro concluído com sucesso")
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user_type=user_data.tipo_usuario,
            user_id=user_id,
            nome=user_data.nome,
            perfil_id=perfil_id,
        )
    except HTTPException:
        if conn:
            conn.close()
        raise
    except Exception as e:
        print(f"[REGISTER] Erro ao criar usuário: {e}")
        if conn:
            conn.rollback()
            conn.close()
        if "matricula" in str(e).lower():
            raise HTTPException(status_code=400, detail="Matrícula já existe")
        elif "cpf" in str(e).lower():
            raise HTTPException(status_code=400, detail="CPF já existe")
        else:
            raise HTTPException(status_code=400, detail=f"Erro ao criar usuário: {str(e)}")

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Buscar usuário por email (excluindo deletados)
    cursor.execute("SELECT * FROM usuarios WHERE email = %s AND deleted_at IS NULL", (user_data.email,))
    user_data_db = cursor.fetchone()

    if not user_data_db:
        conn.close()
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    columns = ['id', 'email', 'password_hash', 'tipo_usuario', 'perfil_id', 'data_cadastro']
    user_dict = dict(zip(columns, user_data_db))

    # Verificar senha
    if not verify_password(user_data.password, user_dict['password_hash']):
        conn.close()
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    # Buscar nome do perfil
    nome = ""
    if user_dict['perfil_id']:
        if user_dict['tipo_usuario'] == 'aluno':
            cursor.execute("SELECT nome FROM alunos WHERE id = %s", (user_dict['perfil_id'],))
        elif user_dict['tipo_usuario'] == 'professor':
            cursor.execute("SELECT nome FROM professores WHERE id = %s", (user_dict['perfil_id'],))
        elif user_dict['tipo_usuario'] == 'colaborador':
            cursor.execute("SELECT nome FROM colaboradores WHERE id = %s", (user_dict['perfil_id'],))
        elif user_dict['tipo_usuario'] == 'administrador':
            cursor.execute("SELECT nome FROM administradores WHERE id = %s", (user_dict['perfil_id'],))
        result = cursor.fetchone()
        if result:
            nome = result[0]
    
    conn.close()

    # Gerar tokens
    access_token = create_access_token(
        data={"sub": user_dict['id'], "user_type": user_dict['tipo_usuario']},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_access_token(
        data={"sub": user_dict['id'], "user_type": user_dict['tipo_usuario'], "type": "refresh"},
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    # Salvar refresh token no banco
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE usuarios SET refresh_token = %s WHERE id = %s",
        (refresh_token, user_dict['id'])
    )
    conn.commit()
    conn.close()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_type=user_dict['tipo_usuario'],
        user_id=user_dict['id'],
        nome=nome,
        perfil_id=user_dict.get('perfil_id'),
    )

@app.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return enrich_user(current_user)

@app.post("/auth/refresh", response_model=Token)
async def refresh_token(request: RefreshTokenRequest):
    try:
        # Decodificar refresh token
        payload = jwt.decode(request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])

        # Verificar se é um refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")

        user_id = payload.get("sub")
        user_type = payload.get("user_type")

        # Buscar usuário e verificar refresh token
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM usuarios WHERE id = %s AND refresh_token = %s AND deleted_at IS NULL",
            (user_id, request.refresh_token)
        )
        user_data_db = cursor.fetchone()

        if not user_data_db:
            conn.close()
            raise HTTPException(status_code=401, detail="Refresh token inválido")

        columns = ['id', 'email', 'password_hash', 'tipo_usuario', 'perfil_id', 'data_cadastro']
        user_dict = dict(zip(columns, user_data_db))

        # Buscar nome do perfil
        nome = ""
        if user_dict['perfil_id']:
            if user_dict['tipo_usuario'] == 'aluno':
                cursor.execute("SELECT nome FROM alunos WHERE id = %s", (user_dict['perfil_id'],))
            elif user_dict['tipo_usuario'] == 'professor':
                cursor.execute("SELECT nome FROM professores WHERE id = %s", (user_dict['perfil_id'],))
            elif user_dict['tipo_usuario'] == 'colaborador':
                cursor.execute("SELECT nome FROM colaboradores WHERE id = %s", (user_dict['perfil_id'],))
            elif user_dict['tipo_usuario'] == 'administrador':
                cursor.execute("SELECT nome FROM administradores WHERE id = %s", (user_dict['perfil_id'],))
            result = cursor.fetchone()
            if result:
                nome = result[0]

        conn.close()

        # Gerar novo access token
        new_access_token = create_access_token(
            data={"sub": user_dict['id'], "user_type": user_dict['tipo_usuario']},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        # Gerar novo refresh token
        new_refresh_token = create_access_token(
            data={"sub": user_dict['id'], "user_type": user_dict['tipo_usuario'], "type": "refresh"},
            expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )

        # Atualizar refresh token no banco
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE usuarios SET refresh_token = %s WHERE id = %s",
            (new_refresh_token, user_dict['id'])
        )
        conn.commit()
        conn.close()

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            user_type=user_dict['tipo_usuario'],
            user_id=user_dict['id'],
            nome=nome,
            perfil_id=user_dict.get('perfil_id'),
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

# Endpoints de Alunos
@app.post("/alunos", response_model=Aluno)
async def create_aluno(aluno: Aluno, current_user: User = Depends(require_administrador)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se matrícula já existe
    cursor.execute("SELECT id FROM alunos WHERE matricula = %s", (aluno.matricula,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Matrícula já cadastrada")

    aluno_id = str(uuid.uuid4())
    data_cadastro = datetime.now()

    try:
        cursor.execute(
            "INSERT INTO alunos (id, nome, matricula, curso, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (aluno_id, aluno.nome, aluno.matricula, aluno.curso, aluno.telefone, aluno.email, data_cadastro)
        )
        conn.commit()

        aluno.id = aluno_id
        aluno.data_cadastro = data_cadastro
        return aluno
    except Exception as e:
        conn.rollback()
        conn.close()
        if "matricula" in str(e):
            raise HTTPException(status_code=400, detail="Matrícula já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao cadastrar aluno")
    finally:
        conn.close()

@app.get("/alunos", response_model=List[Aluno])
async def get_alunos(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Apenas administrador pode ver todos os alunos
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM alunos WHERE deleted_at IS NULL ORDER BY nome")
        rows = cursor.fetchall()
        alunos = [dict_from_row(cursor, row) for row in rows]
    elif current_user.tipo_usuario == "aluno":
        # Aluno só pode ver seus próprios dados
        cursor.execute("SELECT * FROM alunos WHERE id = %s AND deleted_at IS NULL", (current_user.perfil_id,))
        row = cursor.fetchone()
        alunos = [dict_from_row(cursor, row)] if row else []
    else:
        # Professor e colaborador não podem ver alunos
        alunos = []

    conn.close()
    return alunos

@app.get("/alunos/{aluno_id}", response_model=Aluno)
async def get_aluno(aluno_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar permissão: administrador pode ver qualquer aluno, aluno só pode ver seus próprios dados
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM alunos WHERE id = %s AND deleted_at IS NULL", (aluno_id,))
    elif current_user.tipo_usuario == "aluno" and current_user.perfil_id == aluno_id:
        cursor.execute("SELECT * FROM alunos WHERE id = %s AND deleted_at IS NULL", (aluno_id,))
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Acesso negado")

    row = cursor.fetchone()
    aluno = dict_from_row(cursor, row)

    conn.close()

    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    return aluno

@app.put("/alunos/{aluno_id}", response_model=Aluno)
async def update_aluno(aluno_id: str, aluno: Aluno, current_user: User = Depends(require_self_or_admin())):
    # Verificar se o usuário é admin ou está editando seu próprio perfil
    print(f"DEBUG: current_user.tipo_usuario={current_user.tipo_usuario}, current_user.perfil_id={current_user.perfil_id}, aluno_id={aluno_id}")
    if current_user.tipo_usuario != "administrador" and current_user.perfil_id != aluno_id:
        raise HTTPException(status_code=403, detail=f"Acesso negado. Você só pode editar seu próprio perfil. (perfil_id={current_user.perfil_id}, aluno_id={aluno_id})")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se matrícula já existe (exceto para o próprio aluno)
    cursor.execute("SELECT id FROM alunos WHERE matricula = %s AND id != %s", (aluno.matricula, aluno_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Matrícula já cadastrada")

    try:
        cursor.execute(
            "UPDATE alunos SET nome = %s, matricula = %s, curso = %s, telefone = %s, email = %s, foto_perfil = %s WHERE id = %s",
            (aluno.nome, aluno.matricula, aluno.curso, aluno.telefone, aluno.email, aluno.foto_perfil, aluno_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        if "matricula" in str(e):
            raise HTTPException(status_code=400, detail="Matrícula já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao atualizar aluno")
    
    cursor.execute("SELECT * FROM alunos WHERE id = %s", (aluno_id,))
    row = cursor.fetchone()
    updated_aluno = dict_from_row(cursor, row)
    
    conn.close()
    
    if not updated_aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    return updated_aluno

@app.delete("/alunos/{aluno_id}")
async def delete_aluno(aluno_id: str, current_user: User = Depends(require_administrador)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Soft delete
        cursor.execute("UPDATE alunos SET deleted_at = %s WHERE id = %s", (datetime.now(), aluno_id))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")

        return {"message": "Aluno deletado com sucesso"}
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar aluno: {str(e)}")
    finally:
        if conn:
            conn.close()

# Endpoints de Professores
@app.post("/professores", response_model=Professor)
async def create_professor(professor: Professor, current_user: User = Depends(require_administrador)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se matrícula já existe
    cursor.execute("SELECT id FROM professores WHERE matricula = %s", (professor.matricula,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Matrícula já cadastrada")

    professor_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()

    try:
        cursor.execute(
            "INSERT INTO professores (id, nome, matricula, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s)",
            (professor_id, professor.nome, professor.matricula, professor.telefone, professor.email, data_cadastro)
        )
        conn.commit()

        professor.id = professor_id
        professor.data_cadastro = data_cadastro
        return professor
    except Exception as e:
        conn.rollback()
        conn.close()
        if "matricula" in str(e):
            raise HTTPException(status_code=400, detail="Matrícula já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao cadastrar professor")
    finally:
        conn.close()

@app.get("/professores", response_model=List[Professor])
async def get_professores(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Apenas administrador pode ver todos os professores
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM professores WHERE deleted_at IS NULL ORDER BY nome")
        professores = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    elif current_user.tipo_usuario == "professor":
        # Professor só pode ver seus próprios dados
        cursor.execute("SELECT * FROM professores WHERE id = %s AND deleted_at IS NULL", (current_user.perfil_id,))
        row = cursor.fetchone()
        professores = [dict_from_row(cursor, row)] if row else []
    else:
        # Aluno e colaborador não podem ver professores
        professores = []

    conn.close()
    return professores

@app.get("/professores/{professor_id}", response_model=Professor)
async def get_professor(professor_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar permissão: administrador pode ver qualquer professor, professor só pode ver seus próprios dados
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM professores WHERE id = %s AND deleted_at IS NULL", (professor_id,))
    elif current_user.tipo_usuario == "professor" and current_user.perfil_id == professor_id:
        cursor.execute("SELECT * FROM professores WHERE id = %s AND deleted_at IS NULL", (professor_id,))
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Acesso negado")

    professor = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")

    return professor

@app.put("/professores/{professor_id}", response_model=Professor)
async def update_professor(professor_id: str, professor: Professor, current_user: User = Depends(require_self_or_admin())):
    # Verificar se o usuário é admin ou está editando seu próprio perfil
    if current_user.tipo_usuario != "administrador" and current_user.perfil_id != professor_id:
        raise HTTPException(status_code=403, detail="Acesso negado. Você só pode editar seu próprio perfil.")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se matrícula já existe (exceto para o próprio professor)
    cursor.execute("SELECT id FROM professores WHERE matricula = %s AND id != %s", (professor.matricula, professor_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Matrícula já cadastrada")

    try:
        cursor.execute(
            "UPDATE professores SET nome = %s, matricula = %s, telefone = %s, email = %s, foto_perfil = %s WHERE id = %s",
            (professor.nome, professor.matricula, professor.telefone, professor.email, professor.foto_perfil, professor_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        if "matricula" in str(e):
            raise HTTPException(status_code=400, detail="Matrícula já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao atualizar professor")
    
    cursor.execute("SELECT * FROM professores WHERE id = %s", (professor_id,))
    updated_professor = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not updated_professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    return updated_professor

@app.delete("/professores/{professor_id}")
async def delete_professor(professor_id: str, current_user: User = Depends(require_administrador)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Soft delete
        cursor.execute("UPDATE professores SET deleted_at = %s WHERE id = %s", (datetime.now(), professor_id))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Professor não encontrado")

        return {"message": "Professor deletado com sucesso"}
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar professor: {str(e)}")
    finally:
        if conn:
            conn.close()

# Endpoints de Colaboradores
@app.post("/colaboradores", response_model=Colaborador)
async def create_colaborador(colaborador: Colaborador, current_user: User = Depends(require_administrador)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se CPF já existe
    cursor.execute("SELECT id FROM colaboradores WHERE cpf = %s", (colaborador.cpf,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="CPF já cadastrado")

    colaborador_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()

    try:
        cursor.execute(
            "INSERT INTO colaboradores (id, nome, cpf, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s)",
            (colaborador_id, colaborador.nome, colaborador.cpf, colaborador.telefone, colaborador.email, data_cadastro)
        )
        conn.commit()

        colaborador.id = colaborador_id
        colaborador.data_cadastro = data_cadastro
        return colaborador
    except Exception as e:
        conn.rollback()
        conn.close()
        if "cpf" in str(e):
            raise HTTPException(status_code=400, detail="CPF já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao cadastrar colaborador")
    finally:
        conn.close()

@app.get("/colaboradores", response_model=List[Colaborador])
async def get_colaboradores(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Apenas administrador pode ver todos os colaboradores
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM colaboradores WHERE deleted_at IS NULL ORDER BY nome")
        colaboradores = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    elif current_user.tipo_usuario == "colaborador":
        # Colaborador só pode ver seus próprios dados
        cursor.execute("SELECT * FROM colaboradores WHERE id = %s AND deleted_at IS NULL", (current_user.perfil_id,))
        row = cursor.fetchone()
        colaboradores = [dict_from_row(cursor, row)] if row else []
    else:
        # Aluno e professor não podem ver colaboradores
        colaboradores = []

    conn.close()
    return colaboradores

@app.get("/colaboradores/{colaborador_id}", response_model=Colaborador)
async def get_colaborador(colaborador_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar permissão: administrador pode ver qualquer colaborador, colaborador só pode ver seus próprios dados
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM colaboradores WHERE id = %s AND deleted_at IS NULL", (colaborador_id,))
    elif current_user.tipo_usuario == "colaborador" and current_user.perfil_id == colaborador_id:
        cursor.execute("SELECT * FROM colaboradores WHERE id = %s AND deleted_at IS NULL", (colaborador_id,))
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Acesso negado")

    colaborador = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")

    return colaborador

@app.put("/colaboradores/{colaborador_id}", response_model=Colaborador)
async def update_colaborador(colaborador_id: str, colaborador: Colaborador, current_user: User = Depends(require_self_or_admin())):
    # Verificar se o usuário é admin ou está editando seu próprio perfil
    if current_user.tipo_usuario != "administrador" and current_user.perfil_id != colaborador_id:
        raise HTTPException(status_code=403, detail="Acesso negado. Você só pode editar seu próprio perfil.")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se CPF já existe (exceto para o próprio colaborador)
    cursor.execute("SELECT id FROM colaboradores WHERE cpf = %s AND id != %s", (colaborador.cpf, colaborador_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="CPF já cadastrado")

    try:
        cursor.execute(
            "UPDATE colaboradores SET nome = %s, cpf = %s, telefone = %s, email = %s, foto_perfil = %s WHERE id = %s",
            (colaborador.nome, colaborador.cpf, colaborador.telefone, colaborador.email, colaborador.foto_perfil, colaborador_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        if "cpf" in str(e):
            raise HTTPException(status_code=400, detail="CPF já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao atualizar colaborador")
    
    cursor.execute("SELECT * FROM colaboradores WHERE id = %s", (colaborador_id,))
    updated_colaborador = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not updated_colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    return updated_colaborador

# Endpoints de Administradores
@app.get("/administradores", response_model=List[Administrador])
async def get_administradores(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Apenas administrador pode ver todos os administradores
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM administradores WHERE deleted_at IS NULL ORDER BY nome")
        administradores = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    elif current_user.tipo_usuario == "administrador" and current_user.perfil_id:
        # Administrador só pode ver seus próprios dados
        cursor.execute("SELECT * FROM administradores WHERE id = %s AND deleted_at IS NULL", (current_user.perfil_id,))
        row = cursor.fetchone()
        administradores = [dict_from_row(cursor, row)] if row else []
    else:
        # Outros não podem ver administradores
        administradores = []

    conn.close()
    return administradores

@app.get("/administradores/{administrador_id}", response_model=Administrador)
async def get_administrador(administrador_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar permissão: administrador pode ver qualquer administrador, administrador só pode ver seus próprios dados
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM administradores WHERE id = %s AND deleted_at IS NULL", (administrador_id,))
    elif current_user.tipo_usuario == "administrador" and current_user.perfil_id == administrador_id:
        cursor.execute("SELECT * FROM administradores WHERE id = %s AND deleted_at IS NULL", (administrador_id,))
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Acesso negado")

    administrador = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not administrador:
        raise HTTPException(status_code=404, detail="Administrador não encontrado")

    return administrador

@app.put("/administradores/{administrador_id}", response_model=Administrador)
async def update_administrador(administrador_id: str, administrador: Administrador, current_user: User = Depends(require_self_or_admin())):
    # Verificar se o usuário é admin ou está editando seu próprio perfil
    if current_user.tipo_usuario != "administrador" and current_user.perfil_id != administrador_id:
        raise HTTPException(status_code=403, detail="Acesso negado. Você só pode editar seu próprio perfil.")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se CPF já existe (exceto para o próprio administrador)
    cursor.execute("SELECT id FROM administradores WHERE cpf = %s AND id != %s", (administrador.cpf, administrador_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="CPF já cadastrado")

    try:
        cursor.execute(
            "UPDATE administradores SET nome = %s, cpf = %s, telefone = %s, email = %s, foto_perfil = %s WHERE id = %s",
            (administrador.nome, administrador.cpf, administrador.telefone, administrador.email, administrador.foto_perfil, administrador_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        if "cpf" in str(e):
            raise HTTPException(status_code=400, detail="CPF já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao atualizar administrador")

    cursor.execute("SELECT * FROM administradores WHERE id = %s", (administrador_id,))
    updated_administrador = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not updated_administrador:
        raise HTTPException(status_code=404, detail="Administrador não encontrado")

    return updated_administrador

@app.delete("/administradores/{administrador_id}")
async def delete_administrador(administrador_id: str, current_user: User = Depends(require_administrador)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Soft delete
        cursor.execute("UPDATE administradores SET deleted_at = %s WHERE id = %s", (datetime.now(), administrador_id))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Administrador não encontrado")

        return {"message": "Administrador deletado com sucesso"}
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar administrador: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.delete("/colaboradores/{colaborador_id}")
async def delete_colaborador(colaborador_id: str, current_user: User = Depends(require_administrador)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Soft delete
        cursor.execute("UPDATE colaboradores SET deleted_at = %s WHERE id = %s", (datetime.now(), colaborador_id))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")

        return {"message": "Colaborador deletado com sucesso"}
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar colaborador: {str(e)}")
    finally:
        if conn:
            conn.close()

# Endpoints de Material de Consumo
@app.post("/material-consumo", response_model=MaterialConsumo)
async def create_material_consumo(material: MaterialConsumo, current_user: User = Depends(require_administrador)):
    # Validar quantidade não negativa
    if material.quantidade < 0:
        raise HTTPException(status_code=400, detail="Quantidade não pode ser negativa")

    conn = get_db_connection()
    cursor = conn.cursor()

    material_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()

    cursor.execute(
        "INSERT INTO material_consumo (id, tipo, descricao, quantidade, data_cadastro) VALUES (%s, %s, %s, %s, %s)",
        (material_id, material.tipo, material.descricao, material.quantidade, data_cadastro)
    )
    
    material.id = material_id
    material.data_cadastro = data_cadastro
    conn.close()
    return material

@app.get("/material-consumo", response_model=List[MaterialConsumo])
async def get_material_consumo(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM material_consumo ORDER BY tipo")
    materiais = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    
    conn.close()
    return materiais

@app.get("/material-consumo/{material_id}", response_model=MaterialConsumo)
async def get_material_consumo_by_id(material_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM material_consumo WHERE id = %s", (material_id,))
    material = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not material:
        raise HTTPException(status_code=404, detail="Material de consumo não encontrado")
    
    return material

@app.put("/material-consumo/{material_id}", response_model=MaterialConsumo)
async def update_material_consumo(material_id: str, material: MaterialConsumo, current_user: User = Depends(require_administrador)):
    # Validar quantidade não negativa
    if material.quantidade < 0:
        raise HTTPException(status_code=400, detail="Quantidade não pode ser negativa")

    conn = get_db_connection()
    cursor = conn.cursor()

    data_atualizacao = datetime.now().isoformat()

    cursor.execute(
        "UPDATE material_consumo SET tipo = %s, descricao = %s, quantidade = %s, data_atualizacao = %s WHERE id = %s",
        (material.tipo, material.descricao, material.quantidade, data_atualizacao, material_id)
    )
    
    cursor.execute("SELECT * FROM material_consumo WHERE id = %s", (material_id,))
    updated_material = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not updated_material:
        raise HTTPException(status_code=404, detail="Material de consumo não encontrado")
    
    return updated_material

@app.delete("/material-consumo/{material_id}")
async def delete_material_consumo(material_id: str, current_user: User = Depends(require_administrador)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM material_consumo WHERE id = %s", (material_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Material de consumo não encontrado")
    
    conn.close()
    return {"message": "Material de consumo deletado com sucesso"}

# Endpoints de Material Permanente
@app.post("/material-permanente", response_model=MaterialPermanente)
async def create_material_permanente(material: MaterialPermanente, current_user: User = Depends(require_administrador)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    material_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()
    
    try:
        cursor.execute(
            "INSERT INTO material_permanente (id, tipo, patrimonio, modelo, marca, descricao, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (material_id, material.tipo, material.patrimonio, material.modelo, material.marca, material.descricao, data_cadastro)
        )
        
        material.id = material_id
        material.data_cadastro = data_cadastro
        return material
    except Exception as e:
        conn.close()
        if "patrimonio" in str(e):
            raise HTTPException(status_code=400, detail="Patrimônio já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao cadastrar material permanente")
    finally:
        conn.close()

@app.get("/material-permanente", response_model=List[MaterialPermanente])
async def get_material_permanente(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM material_permanente ORDER BY tipo")
    materiais = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    
    conn.close()
    return materiais

@app.get("/material-permanente/{material_id}", response_model=MaterialPermanente)
async def get_material_permanente_by_id(material_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM material_permanente WHERE id = %s", (material_id,))
    material = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not material:
        raise HTTPException(status_code=404, detail="Material permanente não encontrado")
    
    return material

@app.put("/material-permanente/{material_id}", response_model=MaterialPermanente)
async def update_material_permanente(material_id: str, material: MaterialPermanente, current_user: User = Depends(require_administrador)):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        data_atualizacao = datetime.now().isoformat()

        cursor.execute(
            "UPDATE material_permanente SET tipo = %s, patrimonio = %s, modelo = %s, marca = %s, descricao = %s, data_atualizacao = %s WHERE id = %s",
            (material.tipo, material.patrimonio, material.modelo, material.marca, material.descricao, data_atualizacao, material_id)
        )
    except Exception as e:
        conn.close()
        if "patrimonio" in str(e):
            raise HTTPException(status_code=400, detail="Patrimônio já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao atualizar material permanente")
    
    cursor.execute("SELECT * FROM material_permanente WHERE id = %s", (material_id,))
    updated_material = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not updated_material:
        raise HTTPException(status_code=404, detail="Material permanente não encontrado")
    
    return updated_material

@app.delete("/material-permanente/{material_id}")
async def delete_material_permanente(material_id: str, current_user: User = Depends(require_administrador)):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM material_permanente WHERE id = %s", (material_id,))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Material permanente não encontrado")

    conn.close()
    return {"message": "Material permanente deletado com sucesso"}

# Endpoints de Projetos
@app.post("/projetos", response_model=Projeto)
async def create_projeto(projeto: Projeto, current_user: User = Depends(require_professor_colaborador_or_administrador)):
    validate_coordenador_is_professor(projeto.coordenador)
    # Validar datas
    if projeto.data_previsao < projeto.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data de previsão de término deve ser igual ou posterior à data de início"
        )

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        projeto_id = str(uuid.uuid4())
        data_cadastro = datetime.now().isoformat()

        cursor.execute(
            "INSERT INTO projetos (id, nome, descricao, status, coordenador, membros, data_inicio, data_previsao, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (projeto_id, projeto.nome, projeto.descricao, projeto.status, projeto.coordenador, projeto.membros, projeto.data_inicio, projeto.data_previsao, data_cadastro)
        )
        conn.commit()

        projeto.id = projeto_id
        projeto.data_cadastro = data_cadastro
        return projeto
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao criar projeto: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.get("/projetos", response_model=List[Projeto])
async def get_projetos(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Administradores podem ver todos os projetos
    if current_user.tipo_usuario == "administrador":
        cursor.execute("SELECT * FROM projetos WHERE deleted_at IS NULL ORDER BY data_cadastro DESC")
        projetos = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    elif current_user.tipo_usuario in ["professor", "colaborador"]:
        # Professores e colaboradores só podem ver projetos onde são coordenadores ou membros
        cursor.execute("SELECT * FROM projetos WHERE deleted_at IS NULL ORDER BY data_cadastro DESC")
        all_projetos = [dict_from_row(cursor, row) for row in cursor.fetchall()]
        projetos = []
        for projeto in all_projetos:
            if is_project_coordenador(current_user, projeto) or is_project_member(current_user, projeto):
                projetos.append(projeto)
    else:
        # Alunos só podem ver projetos onde são membros
        cursor.execute("SELECT * FROM projetos WHERE deleted_at IS NULL ORDER BY data_cadastro DESC")
        all_projetos = [dict_from_row(cursor, row) for row in cursor.fetchall()]
        projetos = []
        for projeto in all_projetos:
            if is_project_member(current_user, projeto):
                projetos.append(projeto)

    conn.close()
    return projetos

@app.get("/projetos/{projeto_id}", response_model=Projeto)
async def get_projeto(projeto_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projetos WHERE id = %s AND deleted_at IS NULL", (projeto_id,))
    projeto = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    # Verificar permissão de acesso
    if not check_project_access(current_user, projeto_id):
        raise HTTPException(status_code=403, detail="Acesso negado a este projeto")

    return projeto

@app.put("/projetos/{projeto_id}", response_model=Projeto)
async def update_projeto(projeto_id: str, projeto: Projeto, current_user: User = Depends(require_professor_colaborador_or_administrador)):
    validate_coordenador_is_professor(projeto.coordenador)
    # Validar datas
    if projeto.data_previsao < projeto.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data de previsão de término deve ser igual ou posterior à data de início"
        )

    # Verificar se professor/colaborador é coordenador do projeto
    if current_user.tipo_usuario in ["professor", "colaborador"]:
        projeto_existente = get_projeto_dict(projeto_id)
        if not is_project_coordenador(current_user, projeto_existente):
            raise HTTPException(
                status_code=403,
                detail="Acesso negado. Você precisa ser coordenador deste projeto para editá-lo."
            )

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        data_atualizacao = datetime.now().isoformat()

        cursor.execute(
            "UPDATE projetos SET nome = %s, descricao = %s, status = %s, coordenador = %s, membros = %s, data_inicio = %s, data_previsao = %s, data_atualizacao = %s WHERE id = %s",
            (projeto.nome, projeto.descricao, projeto.status, projeto.coordenador, projeto.membros, projeto.data_inicio, projeto.data_previsao, data_atualizacao, projeto_id)
        )
        conn.commit()

        cursor.execute("SELECT * FROM projetos WHERE id = %s", (projeto_id,))
        updated_projeto = dict_from_row(cursor, cursor.fetchone())

        if not updated_projeto:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")

        return updated_projeto
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar projeto: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.delete("/projetos/{projeto_id}")
async def delete_projeto(projeto_id: str, current_user: User = Depends(require_administrador)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE projetos SET deleted_at = %s WHERE id = %s", (datetime.now(), projeto_id))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")

        return {"message": "Projeto deletado com sucesso"}
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar projeto: {str(e)}")
    finally:
        if conn:
            conn.close()

# Endpoints de Atividades do Projeto (Kanban)
@app.post("/projetos/{projeto_id}/atividades", response_model=ProjetoAtividade)
async def create_atividade(
    projeto_id: str,
    atividade: ProjetoAtividade,
    current_user: User = Depends(get_current_user),
):
    projeto = require_project_view(current_user, projeto_id)
    require_project_member(current_user, projeto)
    if not can_create_activity(current_user, projeto):
        raise HTTPException(status_code=403, detail="Sem permissão para criar atividades neste projeto")
    if current_user.tipo_usuario == "aluno":
        nome = get_user_nome(current_user)
        if atividade.responsavel and atividade.responsavel.strip() != nome:
            raise HTTPException(
                status_code=403,
                detail="Alunos só podem criar atividades atribuídas a si mesmos",
            )

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        atividade_id = str(uuid.uuid4())
        data_cadastro = datetime.now().isoformat()

        cursor.execute(
            "INSERT INTO projeto_atividades (id, projeto_id, titulo, descricao, tipo, status, responsavel, data_conclusao, reuniao_id, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (atividade_id, projeto_id, atividade.titulo, atividade.descricao, atividade.tipo, atividade.status, atividade.responsavel, atividade.data_conclusao, atividade.reuniao_id, data_cadastro)
        )
        conn.commit()

        atividade.id = atividade_id
        atividade.projeto_id = projeto_id
        atividade.data_cadastro = data_cadastro
        return atividade
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao criar atividade: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.get("/projetos/{projeto_id}/atividades", response_model=List[ProjetoAtividade])
async def get_atividades(projeto_id: str, current_user: User = Depends(get_current_user)):
    require_project_view(current_user, projeto_id)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projeto_atividades WHERE projeto_id = %s AND deleted_at IS NULL ORDER BY data_cadastro DESC", (projeto_id,))
    atividades = [dict_from_row(cursor, row) for row in cursor.fetchall()]

    conn.close()
    return atividades

@app.get("/projetos/{projeto_id}/atividades/{atividade_id}", response_model=ProjetoAtividade)
async def get_atividade(
    projeto_id: str,
    atividade_id: str,
    current_user: User = Depends(get_current_user),
):
    require_project_view(current_user, projeto_id)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projeto_atividades WHERE id = %s AND projeto_id = %s AND deleted_at IS NULL", (atividade_id, projeto_id))
    atividade = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    return atividade

@app.put("/projetos/{projeto_id}/atividades/{atividade_id}", response_model=ProjetoAtividade)
async def update_atividade(
    projeto_id: str,
    atividade_id: str,
    atividade: ProjetoAtividade,
    current_user: User = Depends(get_current_user),
):
    projeto = require_project_view(current_user, projeto_id)

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM projeto_atividades WHERE id = %s AND projeto_id = %s",
            (atividade_id, projeto_id),
        )
        existing = dict_from_row(cursor, cursor.fetchone())
        if not existing:
            raise HTTPException(status_code=404, detail="Atividade não encontrada")
        if not can_edit_activity(current_user, existing, projeto):
            raise HTTPException(status_code=403, detail="Sem permissão para editar esta atividade")
        if current_user.tipo_usuario == "aluno":
            nome = get_user_nome(current_user)
            if atividade.responsavel and atividade.responsavel.strip() != nome:
                raise HTTPException(
                    status_code=403,
                    detail="Alunos só podem manter atividades atribuídas a si mesmos",
                )

        data_atualizacao = datetime.now().isoformat()

        cursor.execute(
            "UPDATE projeto_atividades SET titulo = %s, descricao = %s, tipo = %s, status = %s, responsavel = %s, data_conclusao = %s, reuniao_id = %s, data_atualizacao = %s WHERE id = %s AND projeto_id = %s",
            (atividade.titulo, atividade.descricao, atividade.tipo, atividade.status, atividade.responsavel, atividade.data_conclusao, atividade.reuniao_id, data_atualizacao, atividade_id, projeto_id)
        )
        conn.commit()

        cursor.execute("SELECT * FROM projeto_atividades WHERE id = %s", (atividade_id,))
        updated_atividade = dict_from_row(cursor, cursor.fetchone())

        if not updated_atividade:
            raise HTTPException(status_code=404, detail="Atividade não encontrada")

        return updated_atividade
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar atividade: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.delete("/projetos/{projeto_id}/atividades/{atividade_id}")
async def delete_atividade(
    projeto_id: str,
    atividade_id: str,
    current_user: User = Depends(get_current_user),
):
    projeto = require_project_view(current_user, projeto_id)

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM projeto_atividades WHERE id = %s AND projeto_id = %s",
            (atividade_id, projeto_id),
        )
        existing = dict_from_row(cursor, cursor.fetchone())
        if not existing:
            raise HTTPException(status_code=404, detail="Atividade não encontrada")
        if not can_delete_activity(current_user, existing, projeto):
            raise HTTPException(status_code=403, detail="Sem permissão para excluir esta atividade")

        cursor.execute("UPDATE projeto_atividades SET deleted_at = %s WHERE id = %s AND projeto_id = %s", (datetime.now(), atividade_id, projeto_id))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Atividade não encontrada")

        return {"message": "Atividade deletada com sucesso"}
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar atividade: {str(e)}")
    finally:
        if conn:
            conn.close()

# Endpoints de Reuniões do Projeto
@app.post("/projetos/{projeto_id}/reunioes", response_model=ProjetoReuniao)
async def create_reuniao(
    projeto_id: str,
    reuniao: ProjetoReuniao,
    current_user: User = Depends(get_current_user),
):
    projeto = require_project_view(current_user, projeto_id)
    if not can_manage_reuniao(current_user, projeto):
        raise HTTPException(status_code=403, detail="Sem permissão para registrar reuniões neste projeto")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        reuniao_id = str(uuid.uuid4())
        data_cadastro = datetime.now().isoformat()

        cursor.execute(
            "INSERT INTO projeto_reunioes (id, projeto_id, atividade_id, titulo, data_reuniao, participantes, pauta, resumo, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (reuniao_id, projeto_id, reuniao.atividade_id, reuniao.titulo, reuniao.data_reuniao, reuniao.participantes, reuniao.pauta, reuniao.resumo, data_cadastro)
        )

        if reuniao.atividade_id:
            cursor.execute(
                "UPDATE projeto_atividades SET reuniao_id = %s, status = 'done', data_atualizacao = %s WHERE id = %s AND projeto_id = %s",
                (reuniao_id, data_cadastro, reuniao.atividade_id, projeto_id)
            )
        conn.commit()

        reuniao.id = reuniao_id
        reuniao.projeto_id = projeto_id
        reuniao.data_cadastro = data_cadastro
        return reuniao
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao criar reunião: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.get("/projetos/{projeto_id}/reunioes", response_model=List[ProjetoReuniao])
async def get_reunioes(projeto_id: str, current_user: User = Depends(get_current_user)):
    require_project_view(current_user, projeto_id)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projeto_reunioes WHERE projeto_id = %s AND deleted_at IS NULL ORDER BY data_reuniao DESC", (projeto_id,))
    reunioes = [dict_from_row(cursor, row) for row in cursor.fetchall()]

    conn.close()
    return reunioes

@app.get("/projetos/{projeto_id}/reunioes/{reuniao_id}", response_model=ProjetoReuniao)
async def get_reuniao(
    projeto_id: str,
    reuniao_id: str,
    current_user: User = Depends(get_current_user),
):
    require_project_view(current_user, projeto_id)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projeto_reunioes WHERE id = %s AND projeto_id = %s AND deleted_at IS NULL", (reuniao_id, projeto_id))
    reuniao = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not reuniao:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")

    return reuniao

@app.put("/projetos/{projeto_id}/reunioes/{reuniao_id}", response_model=ProjetoReuniao)
async def update_reuniao(
    projeto_id: str,
    reuniao_id: str,
    reuniao: ProjetoReuniao,
    current_user: User = Depends(get_current_user),
):
    projeto = require_project_view(current_user, projeto_id)
    if not can_manage_reuniao(current_user, projeto):
        raise HTTPException(status_code=403, detail="Sem permissão para editar reuniões neste projeto")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        data_atualizacao = datetime.now().isoformat()

        cursor.execute(
            "UPDATE projeto_reunioes SET titulo = %s, data_reuniao = %s, participantes = %s, pauta = %s, resumo = %s, data_atualizacao = %s WHERE id = %s AND projeto_id = %s",
            (reuniao.titulo, reuniao.data_reuniao, reuniao.participantes, reuniao.pauta, reuniao.resumo, data_atualizacao, reuniao_id, projeto_id)
        )
        conn.commit()

        cursor.execute("SELECT * FROM projeto_reunioes WHERE id = %s", (reuniao_id,))
        updated_reuniao = dict_from_row(cursor, cursor.fetchone())

        if not updated_reuniao:
            raise HTTPException(status_code=404, detail="Reunião não encontrada")

        return updated_reuniao
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar reunião: {str(e)}")
    finally:
        if conn:
            conn.close()

@app.delete("/projetos/{projeto_id}/reunioes/{reuniao_id}")
async def delete_reuniao(
    projeto_id: str,
    reuniao_id: str,
    current_user: User = Depends(get_current_user),
):
    require_project_view(current_user, projeto_id)
    if current_user.tipo_usuario != "professor":
        raise HTTPException(
            status_code=403,
            detail="Apenas professores podem excluir registros de reunião.",
        )

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE projeto_reunioes SET deleted_at = %s WHERE id = %s AND projeto_id = %s", (datetime.now(), reuniao_id, projeto_id))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Reunião não encontrada")

        return {"message": "Reunião deletada com sucesso"}
    except HTTPException:
        if conn:
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao deletar reunião: {str(e)}")
    finally:
        if conn:
            conn.close()

# Endpoint de estatísticas do sistema acadêmico
@app.get("/stats")
async def get_stats(current_user: User = Depends(get_current_user)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Contar registros em cada tabela
        cursor.execute("SELECT COUNT(*) FROM alunos")
        alunos_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM professores")
        professores_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM colaboradores")
        colaboradores_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM material_consumo")
        material_consumo_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM material_permanente")
        material_permanente_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COALESCE(SUM(quantidade), 0) FROM material_consumo")
        result = cursor.fetchone()
        total_consumo = result[0] if result and result[0] is not None else 0
        
        conn.close()

        return {
            "alunos": alunos_count,
            "professores": professores_count,
            "colaboradores": colaboradores_count,
            "material_consumo": material_consumo_count,
            "material_permanente": material_permanente_count,
            "total_items_consumo": total_consumo
        }
    except Exception as e:
        print(f"Erro em stats: {e}")
        # Retornar valores padrão em caso de erro
        return {
            "alunos": 0,
            "professores": 0,
            "colaboradores": 0,
            "material_consumo": 0,
            "material_permanente": 0,
            "total_items_consumo": 0
        }

# Endpoint para upload de foto de perfil
@app.post("/upload-foto-perfil")
async def upload_foto_perfil(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Faz upload de uma foto de perfil e retorna a URL"""
    import shutil

    # Validar tipo de arquivo
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Apenas arquivos de imagem são permitidos")

    # Validar tamanho do arquivo (max 5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 5MB.")

    # Criar diretório de uploads se não existir
    upload_dir = "uploads/fotos_perfil"
    try:
        os.makedirs(upload_dir, exist_ok=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar diretório de uploads: {str(e)}")

    # Gerar nome único para o arquivo
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Salvar arquivo
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")

    # Retornar URL do arquivo
    return {"foto_url": f"/uploads/fotos_perfil/{unique_filename}"}

# Endpoint para servir arquivos estáticos de upload
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
