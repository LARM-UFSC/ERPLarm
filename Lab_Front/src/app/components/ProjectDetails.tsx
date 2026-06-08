import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Users, CheckCircle, FolderKanban, ClipboardList, User as UserIcon } from 'lucide-react';
import { Projeto, ProjetoAtividade, ProjetoReuniao, projetoAtividadesService, projetoReunioesService, User } from '../../services/api';
import { GanttChart } from './GanttChart';

interface ProjectDetailsProps {
  projeto: Projeto;
  onBack: () => void;
  onOpenProjectBoard: () => void;
  currentUser?: User | null;
}

export function ProjectDetails({ projeto, onBack, onOpenProjectBoard, currentUser }: ProjectDetailsProps) {
  const [atividades, setAtividades] = useState<ProjetoAtividade[]>([]);
  const [reunioes, setReunioes] = useState<ProjetoReuniao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [projeto.id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [atividadesData, reunioesData] = await Promise.all([
        projetoAtividadesService.getAll(projeto.id),
        projetoReunioesService.getAll(projeto.id),
      ]);
      setAtividades(atividadesData);
      setReunioes(reunioesData);
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const atividadesConcluidas = atividades.filter(a => a.status === 'done').length;
  const atividadesEmAndamento = atividades.filter(a => a.status === 'doing').length;
  const atividadesPendentes = atividades.filter(a => a.status === 'backlog' || a.status === 'todo').length;

  const membrosList = projeto.membros ? projeto.membros.split(',').map(m => m.trim()).filter(Boolean) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'em_andamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'planejamento': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'em_andamento': return 'Em Andamento';
      case 'planejamento': return 'Planejamento';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold">{projeto.nome}</h2>
          <p className="text-muted-foreground">Detalhes do projeto</p>
        </div>
      </div>

      {/* Botão Acessar Atividades/Reuniões */}
      <div className="flex gap-3">
        <button
          onClick={onOpenProjectBoard}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <FolderKanban size={20} />
          Atividades e Reuniões
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total de Atividades</p>
              <p className="text-2xl font-bold">{atividades.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Concluídas</p>
              <p className="text-2xl font-bold">{atividadesConcluidas}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Reuniões</p>
              <p className="text-2xl font-bold">{reunioes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Membros</p>
              <p className="text-2xl font-bold">{membrosList.length + 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Projeto */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderKanban size={20} className="text-primary" />
            Informações do Projeto
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Descrição</label>
              <p className="mt-1">{projeto.descricao || 'Sem descrição'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(projeto.status)}`}>
                    {getStatusLabel(projeto.status)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Data de Cadastro</label>
                <p className="mt-1">
                  {new Date(projeto.data_cadastro).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Data de Início</label>
                <p className="mt-1">{new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Previsão de Término</label>
                <p className="mt-1">{new Date(projeto.data_previsao).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Equipe */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Equipe
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Coordenador</label>
              <div className="mt-1 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <UserIcon size={18} className="text-muted-foreground" />
                <span className="font-medium">{projeto.coordenador}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Membros ({membrosList.length})</label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {membrosList.length > 0 ? (
                  membrosList.map((membro, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <UserIcon size={16} className="text-muted-foreground" />
                      <span>{membro}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum membro cadastrado</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo de Atividades */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Resumo de Atividades</h3>
        
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : atividades.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-muted-foreground text-sm">Pendentes</p>
              <p className="text-2xl font-bold">{atividadesPendentes}</p>
            </div>
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <p className="text-muted-foreground text-sm">Em Andamento</p>
              <p className="text-2xl font-bold">{atividadesEmAndamento}</p>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <p className="text-muted-foreground text-sm">Concluídas</p>
              <p className="text-2xl font-bold">{atividadesConcluidas}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma atividade cadastrada</p>
        )}
      </div>

      {/* Cronograma do Projeto */}
      <GanttChart
        projetoId={projeto.id}
        projetoDataInicio={projeto.data_inicio}
        projetoDataPrevisao={projeto.data_previsao}
      />

      {/* Próximas Reuniões */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Reuniões Recentes
        </h3>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : reunioes.length > 0 ? (
          <div className="space-y-3">
            {reunioes.slice(0, 5).map((reuniao) => (
              <div key={reuniao.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{reuniao.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma reunião cadastrada</p>
        )}
      </div>
    </div>
  );
}
