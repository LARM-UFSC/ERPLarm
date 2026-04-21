#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados aleatórios
Execute: python seed_data.py
"""

import psycopg2
import uuid
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', '12345678'),
        database=os.getenv('DB_NAME', 'lab')
    )

# Dados base para geração
NOMES = [
    "Ana Silva", "Bruno Costa", "Carlos Santos", "Daniela Lima", "Eduardo Souza",
    "Fernanda Oliveira", "Gabriel Pereira", "Helena Rodrigues", "Igor Almeida", "Juliana Martins",
    "Lucas Ferreira", "Mariana Gomes", "Nicolas Ribeiro", "Olivia Barbosa", "Pedro Castro",
    "Quésia Mendes", "Rafael Nunes", "Sofia Cardoso", "Thiago Araújo", "Ursula Dias",
    "Victor Melo", "Wanessa Silva", "Xavier Santos", "Yasmin Oliveira", "Zeca Pereira",
    "Alice Souza", "Bernardo Lima", "Cecília Gomes", "Davi Rodrigues", "Elisa Fernandes"
]

CURSOS = [
    "Engenharia Civil", "Engenharia Elétrica", "Engenharia Mecânica", "Engenharia Química",
    "Engenharia de Computação", "Engenharia de Software", "Ciência da Computação",
    "Sistemas de Informação", "Análise e Desenvolvimento de Sistemas", "Física",
    "Química", "Biologia", "Matemática", "Estatística", "Arquitetura"
]

TIPOS_MATERIAL_CONSUMO = [
    "Lápis", "Caneta", "Caderno", "Papel A4", "Toner", "Clipes", "Grampos",
    "Borracha", "Régua", "Cola", "Tesoura", "Post-it", "Pasta", "Envelope",
    "Etiqueta", "CD", "DVD", "Cartucho", "Pilha", "Fita Adesiva"
]

TIPOS_MATERIAL_PERMANENTE = [
    "Computador", "Monitor", "Impressora", "Scanner", "Projetor", "Ar Condicionado",
    "Microscópio", "Balança", "Estufa", "Autoclave", "Centrífuga", "Espectrofotômetro",
    "Cromatógrafo", "Microscópio Eletrônico", "Câmera Térmica", "Osciloscópio",
    "Multímetro", "Fonte de Alimentação", "Mesa Digitalizadora", "Tablet"
]

MARCAS = ["HP", "Dell", "Lenovo", "Samsung", "LG", "Sony", "Epson", "Canon", "Eletrolux", "Philips", "Bosch", "Siemens"]

MODELOS = ["Pro", "Elite", "Premium", "Standard", "Basic", "Advanced", "Ultra", "Max", "Plus", "X"]

STATUS_PROJETOS = ["planejamento", "em_andamento", "pausado", "concluido", "cancelado"]

DESC_PROJETOS = [
    "Desenvolvimento de sistema de gestão",
    "Pesquisa em inteligência artificial",
    "Análise de dados estatísticos",
    "Desenvolvimento de novo material",
    "Estudo de impacto ambiental",
    "Otimização de processos",
    "Automação de tarefas",
    "Análise de viabilidade técnica",
    "Desenvolvimento de protótipo",
    "Pesquisa de mercado",
    "Estudo de caso clínico",
    "Desenvolvimento de algoritmo",
    "Análise de segurança",
    "Teste de usabilidade",
    "Pesquisa de campo"
]

def gerar_cpf():
    """Gera um CPF válido formatado"""
    def calcular_digito(cpf_base):
        soma = sum(int(digito) * peso for digito, peso in zip(cpf_base, range(len(cpf_base)+1, 1, -1)))
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)

    cpf_base = ''.join([str(random.randint(0, 9)) for _ in range(9)])
    digito1 = calcular_digito(cpf_base)
    digito2 = calcular_digito(cpf_base + digito1)
    return f"{cpf_base[:3]}.{cpf_base[3:6]}.{cpf_base[6:9]}-{digito1}{digito2}"

def gerar_matricula():
    """Gera uma matrícula aleatória"""
    ano = random.randint(2020, 2025)
    numero = random.randint(1000, 9999)
    return f"{ano}{numero}"

def gerar_email(nome):
    """Gera email baseado no nome"""
    dominios = ["@universidade.edu.br", "@lab.edu.br", "@instituto.edu.br"]
    nome_clean = nome.lower().replace(" ", ".").replace("ç", "c").replace("ã", "a").replace("õ", "o").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    return f"{nome_clean}{random.choice(dominios)}"

def gerar_telefone():
    """Gera um telefone brasileiro"""
    ddd = random.choice(["11", "21", "31", "41", "51", "61", "71", "81", "91", "12", "13", "14", "15", "16", "17", "18", "19"])
    numero = ''.join([str(random.randint(0, 9)) for _ in range(9)])
    return f"({ddd}) 9{numero[:4]}-{numero[4:]}"

def seed_alunos(cursor, quantidade=20):
    """Popula tabela de alunos"""
    print(f"Inserindo {quantidade} alunos...")
    alunos_nomes = random.sample(NOMES, min(quantidade, len(NOMES)))

    for i, nome in enumerate(alunos_nomes):
        aluno_id = str(uuid.uuid4())
        matricula = gerar_matricula()
        curso = random.choice(CURSOS)
        telefone = gerar_telefone()
        email = gerar_email(nome)
        data_cadastro = datetime.now() - timedelta(days=random.randint(1, 365))

        try:
            cursor.execute(
                """INSERT INTO alunos (id, nome, matricula, curso, telefone, email, data_cadastro)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (aluno_id, nome, matricula, curso, telefone, email, data_cadastro)
            )
        except psycopg2.errors.UniqueViolation:
            pass  # Ignora duplicados

def seed_professores(cursor, quantidade=10):
    """Popula tabela de professores"""
    print(f"Inserindo {quantidade} professores...")
    professores_nomes = [f"Prof. {nome}" for nome in random.sample(NOMES, min(quantidade, len(NOMES)))]

    for nome in professores_nomes:
        prof_id = str(uuid.uuid4())
        matricula = f"P{gerar_matricula()}"
        telefone = gerar_telefone()
        email = gerar_email(nome.replace("Prof. ", ""))
        data_cadastro = datetime.now() - timedelta(days=random.randint(1, 730))

        try:
            cursor.execute(
                """INSERT INTO professores (id, nome, matricula, telefone, email, data_cadastro)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (prof_id, nome, matricula, telefone, email, data_cadastro)
            )
        except psycopg2.errors.UniqueViolation:
            pass

def seed_colaboradores(cursor, quantidade=8):
    """Popula tabela de colaboradores"""
    print(f"Inserindo {quantidade} colaboradores...")
    colaboradores_nomes = random.sample(NOMES, min(quantidade, len(NOMES)))

    for nome in colaboradores_nomes:
        colab_id = str(uuid.uuid4())
        cpf = gerar_cpf()
        telefone = gerar_telefone()
        email = gerar_email(nome)
        data_cadastro = datetime.now() - timedelta(days=random.randint(1, 365))

        try:
            cursor.execute(
                """INSERT INTO colaboradores (id, nome, cpf, telefone, email, data_cadastro)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (colab_id, nome, cpf, telefone, email, data_cadastro)
            )
        except psycopg2.errors.UniqueViolation:
            pass

def seed_material_consumo(cursor, quantidade=30):
    """Popula tabela de material de consumo"""
    print(f"Inserindo {quantidade} materiais de consumo...")

    for i in range(quantidade):
        material_id = str(uuid.uuid4())
        tipo = random.choice(TIPOS_MATERIAL_CONSUMO)
        descricao = f"{tipo} - {random.choice(['A4', 'Ofício', 'Colorido', 'Premium', 'Econômico'])}"
        quantidade_estoque = random.randint(0, 500)
        data_cadastro = datetime.now() - timedelta(days=random.randint(1, 365))
        data_atualizacao = data_cadastro + timedelta(days=random.randint(1, 30)) if random.random() > 0.3 else None

        try:
            cursor.execute(
                """INSERT INTO material_consumo (id, tipo, descricao, quantidade, data_cadastro, data_atualizacao)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (material_id, tipo, descricao, quantidade_estoque, data_cadastro, data_atualizacao)
            )
        except psycopg2.errors.UniqueViolation:
            pass

def seed_material_permanente(cursor, quantidade=20):
    """Popula tabela de material permanente"""
    print(f"Inserindo {quantidade} materiais permanentes...")

    for i in range(quantidade):
        material_id = str(uuid.uuid4())
        tipo = random.choice(TIPOS_MATERIAL_PERMANENTE)
        patrimonio = f"{random.randint(2020, 2025)}{random.randint(10000, 99999)}"
        marca = random.choice(MARCAS)
        modelo = f"{random.choice(MODELOS)} {random.randint(100, 9999)}"
        descricao = f"{tipo} {marca} {modelo}"
        data_cadastro = datetime.now() - timedelta(days=random.randint(1, 730))
        data_atualizacao = data_cadastro + timedelta(days=random.randint(1, 60)) if random.random() > 0.5 else None

        try:
            cursor.execute(
                """INSERT INTO material_permanente (id, tipo, patrimonio, modelo, marca, descricao, data_cadastro, data_atualizacao)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (material_id, tipo, patrimonio, modelo, marca, descricao, data_cadastro, data_atualizacao)
            )
        except psycopg2.errors.UniqueViolation:
            pass

def seed_projetos(cursor, quantidade=15):
    """Popula tabela de projetos"""
    print(f"Inserindo {quantidade} projetos...")

    # Buscar pessoas para serem coordenadores
    cursor.execute("SELECT nome FROM professores LIMIT 10")
    professores = [row[0] for row in cursor.fetchall()]

    cursor.execute("SELECT nome FROM colaboradores LIMIT 5")
    colaboradores = [row[0] for row in cursor.fetchall()]

    coordenadores = professores + colaboradores
    if not coordenadores:
        coordenadores = ["Prof. Silva", "Dra. Santos", "Coordenador Padrão"]

    # Buscar alunos para serem membros
    cursor.execute("SELECT nome FROM alunos LIMIT 20")
    alunos = [row[0] for row in cursor.fetchall()]

    for i in range(quantidade):
        projeto_id = str(uuid.uuid4())
        nome = f"Projeto {random.choice(['Alpha', 'Beta', 'Gamma', 'Delta', 'Ômega'])}-{random.randint(1, 999)}"
        descricao = random.choice(DESC_PROJETOS)
        status = random.choice(STATUS_PROJETOS)
        coordenador = random.choice(coordenadores)

        # Membros aleatórios (2-5 alunos)
        num_membros = random.randint(2, min(5, len(alunos)))
        membros = ", ".join(random.sample(alunos, num_membros)) if alunos else ""

        # Datas
        dias_atras_inicio = random.randint(30, 180)
        duracao = random.randint(60, 365)

        data_inicio = (datetime.now() - timedelta(days=dias_atras_inicio)).strftime('%Y-%m-%d')
        data_previsao = (datetime.now() - timedelta(days=dias_atras_inicio) + timedelta(days=duracao)).strftime('%Y-%m-%d')

        data_cadastro = datetime.now() - timedelta(days=dias_atras_inicio)
        data_atualizacao = datetime.now() - timedelta(days=random.randint(1, 30)) if status in ["em_andamento", "concluido"] else None

        try:
            cursor.execute(
                """INSERT INTO projetos (id, nome, descricao, status, coordenador, membros, data_inicio, data_previsao, data_cadastro, data_atualizacao)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (projeto_id, nome, descricao, status, coordenador, membros, data_inicio, data_previsao, data_cadastro, data_atualizacao)
            )
        except psycopg2.errors.UniqueViolation:
            pass

def main():
    print("=" * 50)
    print("GERANDO DADOS ALEATÓRIOS PARA O BANCO")
    print("=" * 50)

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Executar seeds
        seed_alunos(cursor, 20)
        seed_professores(cursor, 10)
        seed_colaboradores(cursor, 8)
        seed_material_consumo(cursor, 30)
        seed_material_permanente(cursor, 20)
        seed_projetos(cursor, 15)

        conn.commit()
        print("\n" + "=" * 50)
        print("DADOS INSERIDOS COM SUCESSO!")
        print("=" * 50)

        # Mostrar resumo
        cursor.execute("SELECT COUNT(*) FROM alunos")
        alunos_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM professores")
        prof_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM colaboradores")
        colab_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM material_consumo")
        mat_cons_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM material_permanente")
        mat_perm_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM projetos")
        proj_count = cursor.fetchone()[0]

        print(f"\nResumo:")
        print(f"  - Alunos: {alunos_count}")
        print(f"  - Professores: {prof_count}")
        print(f"  - Colaboradores: {colab_count}")
        print(f"  - Materiais de Consumo: {mat_cons_count}")
        print(f"  - Materiais Permanentes: {mat_perm_count}")
        print(f"  - Projetos: {proj_count}")
        print(f"\nTotal de registros: {alunos_count + prof_count + colab_count + mat_cons_count + mat_perm_count + proj_count}")

    except Exception as e:
        print(f"\nErro ao inserir dados: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

    print("\nExecute o backend e frontend para ver os dados!")
    print("  Backend: python main.py")
    print("  Frontend: npm run dev")

if __name__ == "__main__":
    main()
