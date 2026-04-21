import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, MapPin, BookOpen, GraduationCap, Briefcase } from 'lucide-react';
import { alunosService, professoresService, colaboradoresService, Aluno, Professor, Colaborador } from "../../services/api";

type PersonType = Aluno | Professor | Colaborador;

export function People() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'alunos' | 'professores' | 'colaboradores'>('alunos');
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonType | null>(null);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    curso: '',
    cpf: '',
    telefone: '',
    email: '',
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setAlunos([]);
      setProfessores([]);
      setColaboradores([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const [alunosData, professoresData, colaboradoresData] = await Promise.all([
        alunosService.getAll(),
        professoresService.getAll(),
        colaboradoresService.getAll()
      ]);

      const term = searchTerm.toLowerCase();

      const filteredAlunos = alunosData.filter(a =>
        a.nome.toLowerCase().includes(term) ||
        a.matricula.includes(term) ||
        a.email?.toLowerCase().includes(term) ||
        a.curso?.toLowerCase().includes(term)
      );

      const filteredProfessores = professoresData.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        p.matricula.includes(term) ||
        p.email?.toLowerCase().includes(term)
      );

      const filteredColaboradores = colaboradoresData.filter(c =>
        c.nome.toLowerCase().includes(term) ||
        c.cpf.includes(term) ||
        c.email?.toLowerCase().includes(term)
      );

      setAlunos(filteredAlunos);
      setProfessores(filteredProfessores);
      setColaboradores(filteredColaboradores);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Carregando dados das pessoas...');
      
      const [alunosData, professoresData, colaboradoresData] = await Promise.all([
        alunosService.getAll(),
        professoresService.getAll(),
        colaboradoresService.getAll()
      ]);
      
      console.log('Dados carregados:', {
        alunos: alunosData.length,
        professores: professoresData.length,
        colaboradores: colaboradoresData.length
      });
      
      setAlunos(alunosData);
      setProfessores(professoresData);
      setColaboradores(colaboradoresData);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'alunos': return alunos;
      case 'professores': return professores;
      case 'colaboradores': return colaboradores;
    }
  };

  const currentList = getCurrentList();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (activeTab === 'alunos') {
        const alunoData = {
          nome: formData.nome,
          matricula: formData.matricula,
          curso: formData.curso,
          telefone: formData.telefone || undefined,
          email: formData.email || undefined,
        };
        
        console.log('Enviando dados do aluno:', alunoData);

        if (editingPerson) {
          await alunosService.update(editingPerson.id, alunoData);
        } else {
          await alunosService.create(alunoData);
        }
      } else if (activeTab === 'professores') {
        const professorData = {
          nome: formData.nome,
          matricula: formData.matricula,
          telefone: formData.telefone || undefined,
          email: formData.email || undefined,
        };

        if (editingPerson) {
          await professoresService.update(editingPerson.id, professorData);
        } else {
          await professoresService.create(professorData);
        }
      } else {
        const colaboradorData = {
          nome: formData.nome,
          cpf: formData.cpf,
          telefone: formData.telefone || undefined,
          email: formData.email || undefined,
        };

        if (editingPerson) {
          await colaboradoresService.update(editingPerson.id, colaboradorData);
        } else {
          await colaboradoresService.create(colaboradorData);
        }
      }

      await loadData();
      setShowModal(false);
      setEditingPerson(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar pessoa:', error);
      alert('Erro ao salvar pessoa. Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (person: PersonType) => {
    setEditingPerson(person);
    
    if (activeTab === 'colaboradores') {
      const colaborador = person as Colaborador;
      setFormData({
        nome: colaborador.nome,
        matricula: '',
        curso: '',
        cpf: colaborador.cpf,
        telefone: colaborador.telefone || '',
        email: colaborador.email || '',
      });
    } else if (activeTab === 'professores') {
      const professor = person as Professor;
      setFormData({
        nome: professor.nome,
        matricula: professor.matricula,
        curso: '',
        cpf: '',
        telefone: professor.telefone || '',
        email: professor.email || '',
      });
    } else {
      const aluno = person as Aluno;
      setFormData({
        nome: aluno.nome,
        matricula: aluno.matricula,
        curso: aluno.curso,
        cpf: '',
        telefone: aluno.telefone || '',
        email: aluno.email || '',
      });
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta pessoa?')) {
      try {
        if (activeTab === 'alunos') {
          await alunosService.delete(id);
        } else if (activeTab === 'professores') {
          await professoresService.delete(id);
        } else {
          await colaboradoresService.delete(id);
        }
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir pessoa:', error);
        alert('Erro ao excluir pessoa.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      matricula: '',
      curso: '',
      cpf: '',
      telefone: '',
      email: '',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Gestão de Pessoas</h2>
            <p className="text-muted-foreground mt-1">Cadastro e controle de pessoas</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p>Carregando pessoas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestão de Pessoas</h2>
          <p className="text-muted-foreground mt-1">Cadastro e controle de pessoas</p>
        </div>
        <button
          onClick={() => {
            setEditingPerson(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Nova Pessoa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Alunos</p>
              <h3 className="mt-2 text-blue-600">{alunos.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Professores</p>
              <h3 className="mt-2 text-green-600">{professores.length}</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <GraduationCap className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Colaboradores</p>
              <h3 className="mt-2 text-purple-600">{colaboradores.length}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Briefcase className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-input-background rounded-lg">
            <Search size={20} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, matrícula, CPF ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('alunos')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'alunos' 
              ? 'bg-blue-500 text-white' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Alunos ({alunos.length})
        </button>
        <button
          onClick={() => setActiveTab('professores')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'professores' 
              ? 'bg-green-500 text-white' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Professores ({professores.length})
        </button>
        <button
          onClick={() => setActiveTab('colaboradores')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'colaboradores' 
              ? 'bg-purple-500 text-white' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Colaboradores ({colaboradores.length})
        </button>
      </div>

      {!hasSearched ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <User size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Faça uma busca para encontrar pessoas</h3>
          <p className="text-muted-foreground">
            Digite um nome, matrícula, CPF ou e-mail e clique em Buscar
          </p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Search size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma pessoa encontrada</h3>
          <p className="text-muted-foreground">
            Tente buscar com outros termos
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {currentList.map((person: PersonType) => (
          <div key={person.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3>{person.nome}</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">Ativo</span>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {activeTab === 'colaboradores' 
                    ? (person as Colaborador).cpf
                    : (person as Aluno | Professor).matricula
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(person)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(person.id)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded ${
                  activeTab === 'alunos' 
                    ? 'bg-blue-100 text-blue-700' 
                    : activeTab === 'professores'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {activeTab === 'alunos' && <BookOpen size={14} />}
                  {activeTab === 'professores' && <GraduationCap size={14} />}
                  {activeTab === 'colaboradores' && <Briefcase size={14} />}
                  {activeTab === 'alunos' && (person as Aluno).curso}
                  {activeTab === 'professores' && 'Professor'}
                  {activeTab === 'colaboradores' && 'Colaborador'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={16} />
                <span>{person.telefone || 'Não informado'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={16} />
                <span>{person.email || 'Não informado'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4">
              {editingPerson ? 'Editar' : 'Nova'}{' '}
              {activeTab === 'alunos' ? 'Aluno' : activeTab === 'professores' ? 'Professor' : 'Colaborador'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'colaboradores' ? (
                  <div>
                    <label className="block mb-2">CPF</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block mb-2">Matrícula</label>
                      <input
                        type="text"
                        value={formData.matricula}
                        onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                        placeholder="Ex: 2024001"
                        required
                      />
                    </div>
                    {activeTab === 'alunos' && (
                      <div>
                        <label className="block mb-2">Curso</label>
                        <input
                          type="text"
                          value={formData.curso}
                          onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                          className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                          placeholder="Ex: Engenharia, Medicina"
                          required
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block mb-2">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPerson(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingPerson ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
