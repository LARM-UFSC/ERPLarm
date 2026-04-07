import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, GraduationCap } from 'lucide-react';
import { professoresService, Professor } from '../../services/api';

interface FormData {
  nome: string;
  matricula: string;
  telefone: string;
  email: string;
}

export function Professores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    matricula: '',
    telefone: '',
    email: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const professoresData = await professoresService.getAll();
      setProfessores(professoresData);
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessores = professores.filter((professor) =>
    professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.matricula.includes(searchTerm) ||
    professor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProfessor) {
        await professoresService.update(editingProfessor.id, formData);
      } else {
        await professoresService.create(formData);
      }

      await loadData();
      setShowModal(false);
      setEditingProfessor(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar professor:', error);
      alert('Erro ao salvar professor. Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormData({
      nome: professor.nome,
      matricula: professor.matricula,
      telefone: professor.telefone || '',
      email: professor.email || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este professor?')) {
      try {
        await professoresService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir professor:', error);
        alert('Erro ao excluir professor.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      matricula: '',
      telefone: '',
      email: '',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Gestão de Professores</h2>
            <p className="text-muted-foreground mt-1">Cadastro e controle de professores</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p>Carregando professores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestão de Professores</h2>
          <p className="text-muted-foreground mt-1">Cadastro e controle de professores</p>
        </div>
        <button
          onClick={() => {
            setEditingProfessor(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Novo Professor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total de Professores</p>
              <h3 className="mt-2">{professores.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <User className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Com E-mail</p>
              <h3 className="mt-2 text-blue-600">
                {professores.filter(p => p.email).length}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Mail className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Com Telefone</p>
              <h3 className="mt-2 text-green-600">
                {professores.filter(p => p.telefone).length}
              </h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Phone className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-input-background rounded-lg">
          <Search size={20} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProfessores.map((professor) => (
          <div key={professor.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3>{professor.nome}</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">Ativo</span>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{professor.matricula}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(professor)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(professor.id)}
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
                  <GraduationCap size={14} />
                  Professor
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={16} />
                <span>{professor.telefone || 'Não informado'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={16} />
                <span>{professor.email || 'Não informado'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4">{editingProfessor ? 'Editar Professor' : 'Novo Professor'}</h3>
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
                    placeholder="Ex: PROF001"
                    required
                  />
                </div>
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
              </div>

              <div>
                <label className="block mb-2">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  placeholder="professor@exemplo.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProfessor(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingProfessor ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
