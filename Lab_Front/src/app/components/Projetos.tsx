import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FolderOpen, Calendar, Users, X, Check, ChevronDown, Kanban } from 'lucide-react';
import {
  projetosService, Projeto,
  alunosService, professoresService, colaboradoresService,
  Aluno, Professor, Colaborador
} from '../../services/api';
import { ProjectBoard } from './ProjectBoard';

type Pessoa =
  | (Aluno & { tipo: 'aluno' })
  | (Professor & { tipo: 'professor' })
  | (Colaborador & { tipo: 'colaborador' });

interface FormData {
  nome: string;
  descricao: string;
  status: string;
  coordenador: string;
  membros: string;
  data_inicio: string;
  data_previsao: string;
}

const STATUS_OPTIONS = [
  { value: 'planejamento', label: 'Planejamento', color: 'bg-blue-100 text-blue-700' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-green-100 text-green-700' },
  { value: 'pausado', label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'concluido', label: 'Concluído', color: 'bg-purple-100 text-purple-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700' },
];

export function Projetos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Projeto | null>(null);

  // Dropdown states
  const [showCoordenadorDropdown, setShowCoordenadorDropdown] = useState(false);
  const [showMembrosDropdown, setShowMembrosDropdown] = useState(false);
  const [coordenadorSearch, setCoordenadorSearch] = useState('');
  const [membrosSearch, setMembrosSearch] = useState('');

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    status: 'planejamento',
    coordenador: '',
    membros: '',
    data_inicio: '',
    data_previsao: '',
  });

  const [formErrors, setFormErrors] = useState<{ data_previsao?: string }>({});

  const validateDates = (inicio: string, previsao: string): boolean => {
    if (!inicio || !previsao) return true;
    const dataInicio = new Date(inicio);
    const dataPrevisao = new Date(previsao);
    return dataPrevisao >= dataInicio;
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setProjetos([]);
      setPessoas([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const [projetosData, alunosData, professoresData, colaboradoresData] = await Promise.all([
        projetosService.getAll(),
        alunosService.getAll(),
        professoresService.getAll(),
        colaboradoresService.getAll()
      ]);

      setProjetos(projetosData);

      // Combinar todas as pessoas com seu tipo
      const todasPessoas: Pessoa[] = [
        ...alunosData.map(a => ({ ...a, tipo: 'aluno' as const })),
        ...professoresData.map(p => ({ ...p, tipo: 'professor' as const })),
        ...colaboradoresData.map(c => ({ ...c, tipo: 'colaborador' as const }))
      ];
      setPessoas(todasPessoas);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [projetosData, alunosData, professoresData, colaboradoresData] = await Promise.all([
        projetosService.getAll(),
        alunosService.getAll(),
        professoresService.getAll(),
        colaboradoresService.getAll()
      ]);

      setProjetos(projetosData);

      // Combinar todas as pessoas com seu tipo
      const todasPessoas: Pessoa[] = [
        ...alunosData.map(a => ({ ...a, tipo: 'aluno' as const })),
        ...professoresData.map(p => ({ ...p, tipo: 'professor' as const })),
        ...colaboradoresData.map(c => ({ ...c, tipo: 'colaborador' as const }))
      ];
      setPessoas(todasPessoas);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPessoaDisplay = (nome: string) => {
    const pessoa = pessoas.find(p => p.nome === nome);
    if (!pessoa) return nome;
    const tipoLabel = { aluno: 'Aluno', professor: 'Professor', colaborador: 'Colaborador' }[pessoa.tipo];
    return `${nome} (${tipoLabel})`;
  };

  const filteredProjetos = projetos.filter((projeto) => {
    const matchesSearch =
      projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.coordenador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || projeto.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredPessoasCoordenador = pessoas.filter(p =>
    p.nome.toLowerCase().includes(coordenadorSearch.toLowerCase()) ||
    (p.tipo === 'aluno' && (p as Aluno).matricula.toLowerCase().includes(coordenadorSearch.toLowerCase())) ||
    (p.tipo === 'professor' && (p as Professor).matricula.toLowerCase().includes(coordenadorSearch.toLowerCase())) ||
    (p.tipo === 'colaborador' && (p as Colaborador).cpf.toLowerCase().includes(coordenadorSearch.toLowerCase()))
  );

  const filteredPessoasMembros = pessoas.filter(p =>
    p.nome.toLowerCase().includes(membrosSearch.toLowerCase()) &&
    !formData.membros.split(',').map(m => m.trim()).filter(Boolean).includes(p.nome)
  );

  const membrosSelecionados = formData.membros.split(',').map(m => m.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar datas antes de enviar
    if (!validateDates(formData.data_inicio, formData.data_previsao)) {
      setFormErrors({ data_previsao: 'A data de término deve ser igual ou posterior à data de início' });
      return;
    }

    try {
      const projetoData = {
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        status: formData.status,
        coordenador: formData.coordenador,
        membros: formData.membros || undefined,
        data_inicio: formData.data_inicio,
        data_previsao: formData.data_previsao,
      };

      if (editingProjeto) {
        await projetosService.update(editingProjeto.id, projetoData);
      } else {
        await projetosService.create(projetoData);
      }

      await loadData();
      setShowModal(false);
      setEditingProjeto(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      alert('Erro ao salvar projeto. Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (projeto: Projeto) => {
    setEditingProjeto(projeto);
    setFormData({
      nome: projeto.nome,
      descricao: projeto.descricao || '',
      status: projeto.status,
      coordenador: projeto.coordenador,
      membros: projeto.membros || '',
      data_inicio: projeto.data_inicio,
      data_previsao: projeto.data_previsao,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este projeto?')) {
      try {
        await projetosService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir projeto:', error);
        alert('Erro ao excluir projeto.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      status: 'planejamento',
      coordenador: '',
      membros: '',
      data_inicio: '',
      data_previsao: '',
    });
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {};
    STATUS_OPTIONS.forEach((opt) => {
      counts[opt.value] = projetos.filter((p) => p.status === opt.value).length;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Gestão de Projetos</h2>
            <p className="text-muted-foreground mt-1">Cadastro e acompanhamento de projetos</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p>Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestão de Projetos</h2>
          <p className="text-muted-foreground mt-1">Cadastro e acompanhamento de projetos</p>
        </div>
        <button
          onClick={() => {
            setEditingProjeto(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total de Projetos</p>
              <h3 className="mt-2">{projetos.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <FolderOpen className="text-primary" size={24} />
            </div>
          </div>
        </div>

        {STATUS_OPTIONS.map((status) => (
          <div key={status.value} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">{status.label}</p>
                <h3 className={`mt-2 ${status.color.split(' ')[1]}`}>{statusCounts[status.value] || 0}</h3>
              </div>
              <div className={`p-3 rounded-lg ${status.color.replace('text-', 'bg-').replace('700', '500/10')}`}>
                <FolderOpen className={status.color.split(' ')[1]} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-input-background rounded-lg flex-1">
            <Search size={20} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, coordenador ou descrição..."
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Todos ({projetos.length})
          </button>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === status.value ? status.color : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {status.label} ({statusCounts[status.value] || 0})
            </button>
          ))}
        </div>
      </div>

      {!hasSearched ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Faça uma busca para encontrar projetos</h3>
          <p className="text-muted-foreground">Use o campo de busca acima para procurar projetos por nome, coordenador ou descrição.</p>
        </div>
      ) : (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4">Nome</th>
                <th className="text-left px-6 py-4">Coordenador</th>
                <th className="text-center px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Início</th>
                <th className="text-left px-6 py-4">Previsão</th>
                <th className="text-center px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjetos.map((projeto) => {
                const status = getStatusLabel(projeto.status);
                return (
                  <tr key={projeto.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{projeto.nome}</p>
                        {projeto.descricao && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{projeto.descricao}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        <span title={getPessoaDisplay(projeto.coordenador)}>
                          {projeto.coordenador}
                        </span>
                        {projeto.membros && (
                          <span className="text-xs text-muted-foreground">
                            +{projeto.membros.split(',').length} membros
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-muted-foreground" />
                        {new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-muted-foreground" />
                        {new Date(projeto.data_previsao).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedProject(projeto)}
                          className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                          title="Ver Andamento"
                        >
                          <Kanban size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(projeto)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(projeto.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProjetos.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FolderOpen size={48} className="opacity-50" />
                      <p>Nenhum projeto encontrado</p>
                      <p className="text-sm">Cadastre um novo projeto ou ajuste os filtros</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {selectedProject && (
        <ProjectBoard
          projeto={selectedProject}
          membros={[selectedProject.coordenador, ...(selectedProject.membros?.split(',').map(m => m.trim()).filter(Boolean) || [])]}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4">{editingProjeto ? 'Editar Projeto' : 'Novo Projeto'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Nome do Projeto *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  placeholder="Ex: Pesquisa em IA"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={3}
                  placeholder="Descrição detalhada do projeto"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                    required
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2">Coordenador *</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCoordenadorDropdown(!showCoordenadorDropdown)}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg text-left flex items-center justify-between"
                    >
                      <span className={formData.coordenador ? '' : 'text-muted-foreground'}>
                        {formData.coordenador
                          ? getPessoaDisplay(formData.coordenador)
                          : 'Selecione um coordenador...'}
                      </span>
                      <ChevronDown size={16} />
                    </button>

                    {showCoordenadorDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                        <div className="p-2 border-b border-border">
                          <input
                            type="text"
                            placeholder="Buscar pessoa..."
                            value={coordenadorSearch}
                            onChange={(e) => setCoordenadorSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-input-background border border-border rounded text-sm"
                            autoFocus
                          />
                        </div>
                        <div className="py-1">
                          {filteredPessoasCoordenador.length === 0 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Nenhuma pessoa encontrada
                            </div>
                          )}
                          {filteredPessoasCoordenador.map((pessoa) => {
                            const tipoLabel = { aluno: 'Aluno', professor: 'Professor', colaborador: 'Colaborador' }[pessoa.tipo];
                            const identificador = pessoa.tipo === 'colaborador'
                              ? (pessoa as Colaborador).cpf
                              : (pessoa as Aluno | Professor).matricula;
                            return (
                              <button
                                key={`${pessoa.tipo}-${pessoa.id}`}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, coordenador: pessoa.nome });
                                  setShowCoordenadorDropdown(false);
                                  setCoordenadorSearch('');
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between group"
                              >
                                <div>
                                  <p className="text-sm font-medium">{pessoa.nome}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {tipoLabel} • {identificador}
                                  </p>
                                </div>
                                {formData.coordenador === pessoa.nome && (
                                  <Check size={16} className="text-primary" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-2">Membros da Equipe</label>

                {/* Membros selecionados */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {membrosSelecionados.map((nome) => {
                    const pessoa = pessoas.find(p => p.nome === nome);
                    return (
                      <span
                        key={nome}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {nome}
                        <button
                          type="button"
                          onClick={() => {
                            const novosMembros = membrosSelecionados.filter(m => m !== nome).join(', ');
                            setFormData({ ...formData, membros: novosMembros });
                          }}
                          className="hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Dropdown para adicionar membros */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMembrosDropdown(!showMembrosDropdown)}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg text-left flex items-center justify-between"
                  >
                    <span className="text-muted-foreground">
                      Clique para adicionar membros...
                    </span>
                    <Plus size={16} />
                  </button>

                  {showMembrosDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                      <div className="p-2 border-b border-border">
                        <input
                          type="text"
                          placeholder="Buscar pessoa..."
                          value={membrosSearch}
                          onChange={(e) => setMembrosSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-input-background border border-border rounded text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="py-1">
                        {filteredPessoasMembros.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Nenhuma pessoa disponível
                          </div>
                        )}
                        {filteredPessoasMembros.map((pessoa) => {
                          const tipoLabel = { aluno: 'Aluno', professor: 'Professor', colaborador: 'Colaborador' }[pessoa.tipo];
                          const identificador = pessoa.tipo === 'colaborador'
                            ? (pessoa as Colaborador).cpf
                            : (pessoa as Aluno | Professor).matricula;
                          return (
                            <button
                              key={`${pessoa.tipo}-${pessoa.id}`}
                              type="button"
                              onClick={() => {
                                const novosMembros = [...membrosSelecionados, pessoa.nome].join(', ');
                                setFormData({ ...formData, membros: novosMembros });
                                setMembrosSearch('');
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-muted"
                            >
                              <p className="text-sm font-medium">{pessoa.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {tipoLabel} • {identificador}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Data de Início *</label>
                  <input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2">Previsão de Término *</label>
                  <input
                    type="date"
                    value={formData.data_previsao}
                    min={formData.data_inicio}
                    onChange={(e) => {
                      const novaPrevisao = e.target.value;
                      setFormData({ ...formData, data_previsao: novaPrevisao });
                      if (!validateDates(formData.data_inicio, novaPrevisao)) {
                        setFormErrors({ data_previsao: 'A data de término deve ser igual ou posterior à data de início' });
                      } else {
                        setFormErrors({});
                      }
                    }}
                    className={`w-full px-4 py-2 bg-input-background border rounded-lg ${formErrors.data_previsao ? 'border-destructive' : 'border-border'}`}
                    required
                  />
                  {formErrors.data_previsao && (
                    <p className="text-destructive text-sm mt-1">{formErrors.data_previsao}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProjeto(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingProjeto ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
