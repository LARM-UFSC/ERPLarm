import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, BookOpen } from 'lucide-react';
import { alunosService, Aluno } from '../../services/api';

interface FormData {
  nome: string;
  matricula: string;
  curso: string;
  telefone: string;
  email: string;
}

export function Alunos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    matricula: '',
    curso: '',
    telefone: '',
    email: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const alunosData = await alunosService.getAll();
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.matricula.includes(searchTerm) ||
    aluno.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAluno) {
        await alunosService.update(editingAluno.id, formData);
      } else {
        await alunosService.create(formData);
      }

      await loadData();
      setShowModal(false);
      setEditingAluno(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      alert('Erro ao salvar aluno. Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome,
      matricula: aluno.matricula,
      curso: aluno.curso,
      telefone: aluno.telefone || '',
      email: aluno.email || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este aluno?')) {
      try {
        await alunosService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir aluno:', error);
        alert('Erro ao excluir aluno.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      matricula: '',
      curso: '',
      telefone: '',
      email: '',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Gestão de Alunos</h2>
            <p className="text-muted-foreground mt-1">Cadastro e controle de alunos</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p>Carregando alunos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestão de Alunos</h2>
          <p className="text-muted-foreground mt-1">Cadastro e controle de alunos</p>
        </div>
        <button
          onClick={() => {
            setEditingAluno(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Novo Aluno
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total de Alunos</p>
              <h3 className="mt-2">{alunos.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <User className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Cursos</p>
              <h3 className="mt-2 text-blue-600">
                {new Set(alunos.map(a => a.curso)).size}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Matrículas Ativas</p>
              <h3 className="mt-2 text-green-600">{alunos.length}</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <User className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-input-background rounded-lg">
          <Search size={20} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula, curso ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAlunos.map((aluno) => (
          <div key={aluno.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3>{aluno.nome}</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">Ativo</span>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{aluno.matricula}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(aluno)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(aluno.id)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded">
                  <BookOpen size={14} />
                  {aluno.curso}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={16} />
                <span>{aluno.telefone || 'Não informado'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={16} />
                <span>{aluno.email || 'Não informado'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4">{editingAluno ? 'Editar Aluno' : 'Novo Aluno'}</h3>
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
                <div>
                  <label className="block mb-2">Curso</label>
                  <input
                    type="text"
                    value={formData.curso}
                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                    placeholder="Ex: Engenharia, Medicina, etc."
                    required
                  />
                </div>
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
                    placeholder="aluno@exemplo.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAluno(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingAluno ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
