from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
import psycopg2.extras
import json
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

app = FastAPI(
    title="Lab API",
    description="API completa para servir o Frontend",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Porta padrão do Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Segurança
security = HTTPBearer()

# Modelos Pydantic para Sistema Acadêmico
class Aluno(BaseModel):
    id: Optional[str] = None
    nome: str
    matricula: str
    curso: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_cadastro: Optional[datetime] = None

class Professor(BaseModel):
    id: Optional[str] = None
    nome: str
    matricula: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_cadastro: Optional[datetime] = None

class Colaborador(BaseModel):
    id: Optional[str] = None
    nome: str
    cpf: str
    telefone: Optional[str] = None
    email: Optional[str] = None
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
    projeto_id: str
    titulo: str
    descricao: Optional[str] = None
    status: str = 'backlog'
    responsavel: Optional[str] = None
    data_conclusao: Optional[str] = None
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

class ProjetoReuniao(BaseModel):
    id: Optional[str] = None
    projeto_id: Optional[str] = None
    titulo: str
    data_reuniao: str
    participantes: Optional[str] = None
    pauta: Optional[str] = None
    resumo: Optional[str] = None
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

# Banco de dados PostgreSQL
def get_db_connection():
    try:
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

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Tabela de alunos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alunos (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                matricula TEXT UNIQUE NOT NULL,
                curso TEXT NOT NULL,
                telefone TEXT,
                email TEXT,
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
                status TEXT NOT NULL DEFAULT 'backlog',
                responsavel TEXT,
                data_conclusao TEXT,
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
                titulo TEXT NOT NULL,
                data_reuniao TEXT NOT NULL,
                participantes TEXT,
                pauta TEXT,
                resumo TEXT,
                data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP,
                FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
            )
        ''')

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

# Endpoints de Alunos
@app.post("/alunos", response_model=Aluno)
async def create_aluno(aluno: Aluno):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    aluno_id = str(uuid.uuid4())
    data_cadastro = datetime.now()
    
    try:
        cursor.execute(
            "INSERT INTO alunos (id, nome, matricula, curso, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (aluno_id, aluno.nome, aluno.matricula, aluno.curso, aluno.telefone, aluno.email, data_cadastro)
        )
        
        aluno.id = aluno_id
        aluno.data_cadastro = data_cadastro
        return aluno
    except Exception as e:
        conn.close()
        if "matricula" in str(e):
            raise HTTPException(status_code=400, detail="Matrícula já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao cadastrar aluno")
    finally:
        conn.close()

@app.get("/alunos", response_model=List[Aluno])
async def get_alunos():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM alunos ORDER BY nome")
    rows = cursor.fetchall()
    alunos = [dict_from_row(cursor, row) for row in rows]
    
    conn.close()
    return alunos

@app.get("/alunos/{aluno_id}", response_model=Aluno)
async def get_aluno(aluno_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM alunos WHERE id = %s", (aluno_id,))
    row = cursor.fetchone()
    aluno = dict_from_row(cursor, row)
    
    conn.close()
    
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    return aluno

@app.put("/alunos/{aluno_id}", response_model=Aluno)
async def update_aluno(aluno_id: str, aluno: Aluno):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE alunos SET nome = %s, matricula = %s, curso = %s, telefone = %s, email = %s WHERE id = %s",
            (aluno.nome, aluno.matricula, aluno.curso, aluno.telefone, aluno.email, aluno_id)
        )
    except Exception as e:
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
async def delete_aluno(aluno_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM alunos WHERE id = %s", (aluno_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    conn.close()
    return {"message": "Aluno deletado com sucesso"}

# Endpoints de Professores
@app.post("/professores", response_model=Professor)
async def create_professor(professor: Professor):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    professor_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()
    
    try:
        cursor.execute(
            "INSERT INTO professores (id, nome, matricula, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s)",
            (professor_id, professor.nome, professor.matricula, professor.telefone, professor.email, data_cadastro)
        )
        
        professor.id = professor_id
        professor.data_cadastro = data_cadastro
        return professor
    except Exception as e:
        conn.close()
        if "matricula" in str(e):
            raise HTTPException(status_code=400, detail="Matrícula já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao cadastrar professor")
    finally:
        conn.close()

@app.get("/professores", response_model=List[Professor])
async def get_professores():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM professores ORDER BY nome")
    professores = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    
    conn.close()
    return professores

@app.get("/professores/{professor_id}", response_model=Professor)
async def get_professor(professor_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM professores WHERE id = %s", (professor_id,))
    professor = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    return professor

@app.put("/professores/{professor_id}", response_model=Professor)
async def update_professor(professor_id: str, professor: Professor):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE professores SET nome = %s, matricula = %s, telefone = %s, email = %s WHERE id = %s",
            (professor.nome, professor.matricula, professor.telefone, professor.email, professor_id)
        )
    except Exception as e:
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
async def delete_professor(professor_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM professores WHERE id = %s", (professor_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    conn.close()
    return {"message": "Professor deletado com sucesso"}

# Endpoints de Colaboradores
@app.post("/colaboradores", response_model=Colaborador)
async def create_colaborador(colaborador: Colaborador):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    colaborador_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()
    
    try:
        cursor.execute(
            "INSERT INTO colaboradores (id, nome, cpf, telefone, email, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s)",
            (colaborador_id, colaborador.nome, colaborador.cpf, colaborador.telefone, colaborador.email, data_cadastro)
        )
        
        colaborador.id = colaborador_id
        colaborador.data_cadastro = data_cadastro
        return colaborador
    except Exception as e:
        conn.close()
        if "cpf" in str(e):
            raise HTTPException(status_code=400, detail="CPF já existe")
        else:
            raise HTTPException(status_code=400, detail="Erro ao cadastrar colaborador")
    finally:
        conn.close()

@app.get("/colaboradores", response_model=List[Colaborador])
async def get_colaboradores():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM colaboradores ORDER BY nome")
    colaboradores = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    
    conn.close()
    return colaboradores

@app.get("/colaboradores/{colaborador_id}", response_model=Colaborador)
async def get_colaborador(colaborador_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM colaboradores WHERE id = %s", (colaborador_id,))
    colaborador = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    return colaborador

@app.put("/colaboradores/{colaborador_id}", response_model=Colaborador)
async def update_colaborador(colaborador_id: str, colaborador: Colaborador):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE colaboradores SET nome = %s, cpf = %s, telefone = %s, email = %s WHERE id = %s",
            (colaborador.nome, colaborador.cpf, colaborador.telefone, colaborador.email, colaborador_id)
        )
    except Exception as e:
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

@app.delete("/colaboradores/{colaborador_id}")
async def delete_colaborador(colaborador_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM colaboradores WHERE id = %s", (colaborador_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    conn.close()
    return {"message": "Colaborador deletado com sucesso"}

# Endpoints de Material de Consumo
@app.post("/material-consumo", response_model=MaterialConsumo)
async def create_material_consumo(material: MaterialConsumo):
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
async def get_material_consumo():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM material_consumo ORDER BY tipo")
    materiais = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    
    conn.close()
    return materiais

@app.get("/material-consumo/{material_id}", response_model=MaterialConsumo)
async def get_material_consumo_by_id(material_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM material_consumo WHERE id = %s", (material_id,))
    material = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not material:
        raise HTTPException(status_code=404, detail="Material de consumo não encontrado")
    
    return material

@app.put("/material-consumo/{material_id}", response_model=MaterialConsumo)
async def update_material_consumo(material_id: str, material: MaterialConsumo):
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
async def delete_material_consumo(material_id: str):
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
async def create_material_permanente(material: MaterialPermanente):
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
async def get_material_permanente():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM material_permanente ORDER BY tipo")
    materiais = [dict_from_row(cursor, row) for row in cursor.fetchall()]
    
    conn.close()
    return materiais

@app.get("/material-permanente/{material_id}", response_model=MaterialPermanente)
async def get_material_permanente_by_id(material_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM material_permanente WHERE id = %s", (material_id,))
    material = dict_from_row(cursor, cursor.fetchone())
    
    conn.close()
    
    if not material:
        raise HTTPException(status_code=404, detail="Material permanente não encontrado")
    
    return material

@app.put("/material-permanente/{material_id}", response_model=MaterialPermanente)
async def update_material_permanente(material_id: str, material: MaterialPermanente):
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
async def delete_material_permanente(material_id: str):
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
async def create_projeto(projeto: Projeto):
    # Validar datas
    if projeto.data_previsao < projeto.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data de previsão de término deve ser igual ou posterior à data de início"
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    projeto_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()

    cursor.execute(
        "INSERT INTO projetos (id, nome, descricao, status, coordenador, membros, data_inicio, data_previsao, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (projeto_id, projeto.nome, projeto.descricao, projeto.status, projeto.coordenador, projeto.membros, projeto.data_inicio, projeto.data_previsao, data_cadastro)
    )

    projeto.id = projeto_id
    projeto.data_cadastro = data_cadastro
    conn.close()
    return projeto

@app.get("/projetos", response_model=List[Projeto])
async def get_projetos():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projetos ORDER BY data_cadastro DESC")
    projetos = [dict_from_row(cursor, row) for row in cursor.fetchall()]

    conn.close()
    return projetos

@app.get("/projetos/{projeto_id}", response_model=Projeto)
async def get_projeto(projeto_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projetos WHERE id = %s", (projeto_id,))
    projeto = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return projeto

@app.put("/projetos/{projeto_id}", response_model=Projeto)
async def update_projeto(projeto_id: str, projeto: Projeto):
    # Validar datas
    if projeto.data_previsao < projeto.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data de previsão de término deve ser igual ou posterior à data de início"
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    data_atualizacao = datetime.now().isoformat()

    cursor.execute(
        "UPDATE projetos SET nome = %s, descricao = %s, status = %s, coordenador = %s, membros = %s, data_inicio = %s, data_previsao = %s, data_atualizacao = %s WHERE id = %s",
        (projeto.nome, projeto.descricao, projeto.status, projeto.coordenador, projeto.membros, projeto.data_inicio, projeto.data_previsao, data_atualizacao, projeto_id)
    )

    cursor.execute("SELECT * FROM projetos WHERE id = %s", (projeto_id,))
    updated_projeto = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not updated_projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return updated_projeto

@app.delete("/projetos/{projeto_id}")
async def delete_projeto(projeto_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM projetos WHERE id = %s", (projeto_id,))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    conn.close()
    return {"message": "Projeto deletado com sucesso"}

# Endpoints de Atividades do Projeto (Kanban)
@app.post("/projetos/{projeto_id}/atividades", response_model=ProjetoAtividade)
async def create_atividade(projeto_id: str, atividade: ProjetoAtividade):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se projeto existe
    cursor.execute("SELECT id FROM projetos WHERE id = %s", (projeto_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    atividade_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()

    cursor.execute(
        "INSERT INTO projeto_atividades (id, projeto_id, titulo, descricao, status, responsavel, data_conclusao, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (atividade_id, projeto_id, atividade.titulo, atividade.descricao, atividade.status, atividade.responsavel, atividade.data_conclusao, data_cadastro)
    )

    atividade.id = atividade_id
    atividade.projeto_id = projeto_id
    atividade.data_cadastro = data_cadastro
    conn.close()
    return atividade

@app.get("/projetos/{projeto_id}/atividades", response_model=List[ProjetoAtividade])
async def get_atividades(projeto_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se projeto existe
    cursor.execute("SELECT id FROM projetos WHERE id = %s", (projeto_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    cursor.execute("SELECT * FROM projeto_atividades WHERE projeto_id = %s ORDER BY data_cadastro DESC", (projeto_id,))
    atividades = [dict_from_row(cursor, row) for row in cursor.fetchall()]

    conn.close()
    return atividades

@app.get("/projetos/{projeto_id}/atividades/{atividade_id}", response_model=ProjetoAtividade)
async def get_atividade(projeto_id: str, atividade_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projeto_atividades WHERE id = %s AND projeto_id = %s", (atividade_id, projeto_id))
    atividade = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    return atividade

@app.put("/projetos/{projeto_id}/atividades/{atividade_id}", response_model=ProjetoAtividade)
async def update_atividade(projeto_id: str, atividade_id: str, atividade: ProjetoAtividade):
    conn = get_db_connection()
    cursor = conn.cursor()

    data_atualizacao = datetime.now().isoformat()

    cursor.execute(
        "UPDATE projeto_atividades SET titulo = %s, descricao = %s, status = %s, responsavel = %s, data_conclusao = %s, data_atualizacao = %s WHERE id = %s AND projeto_id = %s",
        (atividade.titulo, atividade.descricao, atividade.status, atividade.responsavel, atividade.data_conclusao, data_atualizacao, atividade_id, projeto_id)
    )

    cursor.execute("SELECT * FROM projeto_atividades WHERE id = %s", (atividade_id,))
    updated_atividade = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not updated_atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    return updated_atividade

@app.delete("/projetos/{projeto_id}/atividades/{atividade_id}")
async def delete_atividade(projeto_id: str, atividade_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM projeto_atividades WHERE id = %s AND projeto_id = %s", (atividade_id, projeto_id))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    conn.close()
    return {"message": "Atividade deletada com sucesso"}

# Endpoints de Reuniões do Projeto
@app.post("/projetos/{projeto_id}/reunioes", response_model=ProjetoReuniao)
async def create_reuniao(projeto_id: str, reuniao: ProjetoReuniao):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se projeto existe
    cursor.execute("SELECT id FROM projetos WHERE id = %s", (projeto_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    reuniao_id = str(uuid.uuid4())
    data_cadastro = datetime.now().isoformat()

    cursor.execute(
        "INSERT INTO projeto_reunioes (id, projeto_id, titulo, data_reuniao, participantes, pauta, resumo, data_cadastro) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (reuniao_id, projeto_id, reuniao.titulo, reuniao.data_reuniao, reuniao.participantes, reuniao.pauta, reuniao.resumo, data_cadastro)
    )
    conn.commit()

    reuniao.id = reuniao_id
    reuniao.projeto_id = projeto_id
    reuniao.data_cadastro = data_cadastro
    conn.close()
    return reuniao

@app.get("/projetos/{projeto_id}/reunioes", response_model=List[ProjetoReuniao])
async def get_reunioes(projeto_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar se projeto existe
    cursor.execute("SELECT id FROM projetos WHERE id = %s", (projeto_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    cursor.execute("SELECT * FROM projeto_reunioes WHERE projeto_id = %s ORDER BY data_reuniao DESC", (projeto_id,))
    reunioes = [dict_from_row(cursor, row) for row in cursor.fetchall()]

    conn.close()
    return reunioes

@app.get("/projetos/{projeto_id}/reunioes/{reuniao_id}", response_model=ProjetoReuniao)
async def get_reuniao(projeto_id: str, reuniao_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projeto_reunioes WHERE id = %s AND projeto_id = %s", (reuniao_id, projeto_id))
    reuniao = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not reuniao:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")

    return reuniao

@app.put("/projetos/{projeto_id}/reunioes/{reuniao_id}", response_model=ProjetoReuniao)
async def update_reuniao(projeto_id: str, reuniao_id: str, reuniao: ProjetoReuniao):
    conn = get_db_connection()
    cursor = conn.cursor()

    data_atualizacao = datetime.now().isoformat()

    cursor.execute(
        "UPDATE projeto_reunioes SET titulo = %s, data_reuniao = %s, participantes = %s, pauta = %s, resumo = %s, data_atualizacao = %s WHERE id = %s AND projeto_id = %s",
        (reuniao.titulo, reuniao.data_reuniao, reuniao.participantes, reuniao.pauta, reuniao.resumo, data_atualizacao, reuniao_id, projeto_id)
    )

    cursor.execute("SELECT * FROM projeto_reunioes WHERE id = %s", (reuniao_id,))
    updated_reuniao = dict_from_row(cursor, cursor.fetchone())

    conn.close()

    if not updated_reuniao:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")

    return updated_reuniao

@app.delete("/projetos/{projeto_id}/reunioes/{reuniao_id}")
async def delete_reuniao(projeto_id: str, reuniao_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM projeto_reunioes WHERE id = %s AND projeto_id = %s", (reuniao_id, projeto_id))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Reunião não encontrada")

    conn.close()
    return {"message": "Reunião deletada com sucesso"}

# Endpoint de estatísticas do sistema acadêmico
@app.get("/stats")
async def get_stats():
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
