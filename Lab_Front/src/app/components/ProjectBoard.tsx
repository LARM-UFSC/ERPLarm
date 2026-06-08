import { useState, useEffect } from 'react';
import { X, Plus, GripVertical, ArrowLeft, Calendar, User, FileText, ClipboardList } from 'lucide-react';
import {
  Projeto,
  AtividadeTipo,
  User as AuthUser,
  alunosService,
  professoresService,
  colaboradoresService,
  projetoAtividadesService,
  projetoReunioesService,
} from '../../services/api';
import { usePermissions, canEditActivity, canDeleteActivity } from '../../hooks/usePermissions';

interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: AtividadeTipo;
  status: 'backlog' | 'todo' | 'doing' | 'done';
  responsavel?: string;
  data_conclusao?: string;
  reuniao_id?: string;
  createdAt: string;
}

type ColumnType = 'backlog' | 'todo' | 'doing' | 'done';

interface Column {
  id: ColumnType;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-muted/50 border-border dark:bg-slate-800/50 dark:border-slate-600' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-500/10 border-blue-500/30 dark:bg-blue-900/30 dark:border-blue-500/50' },
  { id: 'doing', title: 'Doing', color: 'bg-yellow-500/10 border-yellow-500/30 dark:bg-yellow-900/30 dark:border-yellow-500/50' },
  { id: 'done', title: 'Done', color: 'bg-green-500/10 border-green-500/30 dark:bg-green-900/30 dark:border-green-500/50' },
];

interface ProjectBoardProps {
  projeto: Projeto;
  membros: string[];
  onClose: () => void;
  currentUser?: AuthUser | null;
}

type TabType = 'atividades' | 'reunioes';

interface Reuniao {
  id: string;
  titulo: string;
  data_reuniao: string;
  participantes?: string;
  pauta?: string;
  resumo?: string;
  createdAt: string;
}

export function ProjectBoard({ projeto, membros: membrosProp, onClose, currentUser }: ProjectBoardProps) {
  const permissions = usePermissions(currentUser);
  const [membrosLista, setMembrosLista] = useState<string[]>(membrosProp);
  const [activeTab, setActiveTab] = useState<TabType>('atividades');

  // Estados para Atividades (Kanban)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTask, setNewTask] = useState({
    titulo: '',
    descricao: '',
    responsavel: '',
    data_conclusao: '',
    status: 'backlog' as ColumnType,
    tipo: 'tarefa' as AtividadeTipo,
  });

  // Estados para Reuniões
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [pendingReuniaoTask, setPendingReuniaoTask] = useState<Task | null>(null);
  const [showRegisterReuniaoModal, setShowRegisterReuniaoModal] = useState(false);
  const [showAddReuniaoModal, setShowAddReuniaoModal] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<Reuniao | null>(null);
  const [loadingReunioes, setLoadingReunioes] = useState(true);
  const [newReuniao, setNewReuniao] = useState({
    titulo: '',
    data_reuniao: '',
    participantes: '',
    pauta: '',
    resumo: '',
  });

  // Carregar dados da API
  useEffect(() => {
    loadTasks();
    loadReunioes();
    resolveMembrosNomes();
  }, [projeto.id]);

  const resolveMembrosNomes = async () => {
    try {
      const [alunos, professores, colaboradores] = await Promise.all([
        alunosService.getAll(),
        professoresService.getAll(),
        colaboradoresService.getAll(),
      ]);
      const pessoas = [
        ...alunos.map((a) => ({ id: a.id, nome: a.nome })),
        ...professores.map((p) => ({ id: p.id, nome: p.nome })),
        ...colaboradores.map((c) => ({ id: c.id, nome: c.nome })),
      ];
      const ids = (projeto.membros || '').split(',').map((m) => m.trim()).filter(Boolean);
      const nomesMembros = ids.map((id) => pessoas.find((p) => p.id === id || p.nome === id)?.nome || id);
      const lista = [projeto.coordenador, ...nomesMembros].filter(Boolean);
      setMembrosLista([...new Set(lista)]);
    } catch {
      setMembrosLista(membrosProp);
    }
  };

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const atividades = await projetoAtividadesService.getAll(projeto.id);
      const mappedTasks: Task[] = atividades.map((a) => ({
        id: a.id!,
        titulo: a.titulo,
        descricao: a.descricao,
        tipo: a.tipo || 'tarefa',
        status: a.status,
        responsavel: a.responsavel,
        data_conclusao: a.data_conclusao,
        reuniao_id: a.reuniao_id,
        createdAt: a.data_cadastro || new Date().toISOString(),
      }));
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadReunioes = async () => {
    try {
      setLoadingReunioes(true);
      const data = await projetoReunioesService.getAll(projeto.id);
      const mappedReunioes: Reuniao[] = data.map((r) => ({
        id: r.id!,
        titulo: r.titulo,
        data_reuniao: r.data_reuniao,
        participantes: r.participantes,
        pauta: r.pauta,
        resumo: r.resumo,
        createdAt: r.data_cadastro || new Date().toISOString(),
      }));
      setReunioes(mappedReunioes);
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
    } finally {
      setLoadingReunioes(false);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const buildAtividadePayload = (task: Task, overrides: Partial<Task> = {}) => {
    const merged = { ...task, ...overrides };
    return {
      titulo: merged.titulo,
      descricao: merged.descricao,
      tipo: merged.tipo,
      status: merged.status,
      responsavel: merged.responsavel,
      data_conclusao: merged.data_conclusao,
      reuniao_id: merged.reuniao_id,
    };
  };

  const openRegisterReuniaoModal = (task: Task) => {
    setPendingReuniaoTask(task);
    setNewReuniao({
      titulo: task.titulo,
      data_reuniao: task.data_conclusao || new Date().toISOString().split('T')[0],
      participantes: '',
      pauta: task.descricao || '',
      resumo: '',
    });
    setShowRegisterReuniaoModal(true);
  };

  const updateTaskStatus = async (task: Task, newStatus: ColumnType) => {
    if (task.status === newStatus) return;

    if (newStatus === 'done' && task.tipo === 'reuniao' && !task.reuniao_id) {
      openRegisterReuniaoModal(task);
      return;
    }

    const previousStatus = task.status;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      const updated = await projetoAtividadesService.update(
        projeto.id,
        task.id,
        buildAtividadePayload(task, { status: newStatus })
      );
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: updated.status,
                reuniao_id: updated.reuniao_id,
                data_conclusao: updated.data_conclusao,
              }
            : t
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status da atividade:', error);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: previousStatus } : t))
      );
      alert('Erro ao mover atividade');
    }
  };

  const handleDrop = async (e: React.DragEvent, status: ColumnType) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      const task = draggedTask;
      setDraggedTask(null);
      await updateTaskStatus(task, status);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.titulo.trim()) return;

    const initialStatus =
      newTask.tipo === 'reuniao' && newTask.status === 'done' ? 'doing' : newTask.status;

    try {
      const atividade = await projetoAtividadesService.create(projeto.id, {
        titulo: newTask.titulo,
        descricao: newTask.descricao,
        tipo: newTask.tipo,
        status: initialStatus,
        responsavel: newTask.responsavel || undefined,
        data_conclusao: newTask.data_conclusao || undefined,
      });

      const task: Task = {
        id: atividade.id!,
        titulo: atividade.titulo,
        descricao: atividade.descricao,
        tipo: atividade.tipo || 'tarefa',
        status: atividade.status,
        responsavel: atividade.responsavel,
        data_conclusao: atividade.data_conclusao,
        reuniao_id: atividade.reuniao_id,
        createdAt: atividade.data_cadastro || new Date().toISOString(),
      };

      setTasks((prev) => [...prev, task]);
      setNewTask({ titulo: '', descricao: '', responsavel: '', data_conclusao: '', status: 'backlog', tipo: 'tarefa' });
      setShowAddTaskModal(false);

      if (newTask.tipo === 'reuniao' && newTask.status === 'done') {
        openRegisterReuniaoModal(task);
      }
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      alert('Erro ao criar atividade');
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !editingTask.titulo.trim()) return;

    try {
      await projetoAtividadesService.update(
        projeto.id,
        editingTask.id,
        buildAtividadePayload(editingTask)
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                titulo: editingTask.titulo,
                descricao: editingTask.descricao,
                tipo: editingTask.tipo,
                responsavel: editingTask.responsavel,
                data_conclusao: editingTask.data_conclusao,
              }
            : t
        )
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      alert('Erro ao atualizar atividade');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Deseja excluir esta tarefa?')) {
      try {
        await projetoAtividadesService.delete(projeto.id, taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch (error) {
        console.error('Erro ao excluir atividade:', error);
        alert('Erro ao excluir atividade');
      }
    }
  };

  const getTasksByStatus = (status: ColumnType) => {
    return tasks.filter((t) => t.status === status);
  };

  const moveTask = async (task: Task, direction: 'left' | 'right') => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === task.status);
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < COLUMNS.length) {
      await updateTaskStatus(task, COLUMNS[newIndex].id);
    }
  };

  const handleRegisterReuniaoFromActivity = async () => {
    if (!pendingReuniaoTask || !newReuniao.titulo.trim() || !newReuniao.data_reuniao) return;

    try {
      const reuniao = await projetoReunioesService.create(projeto.id, {
        projeto_id: projeto.id,
        atividade_id: pendingReuniaoTask.id,
        titulo: newReuniao.titulo,
        data_reuniao: newReuniao.data_reuniao,
        participantes: newReuniao.participantes || undefined,
        pauta: newReuniao.pauta || undefined,
        resumo: newReuniao.resumo || undefined,
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === pendingReuniaoTask.id
            ? {
                ...t,
                status: 'done',
                reuniao_id: reuniao.id,
                data_conclusao: newReuniao.data_reuniao,
              }
            : t
        )
      );

      await loadReunioes();
      setShowRegisterReuniaoModal(false);
      setPendingReuniaoTask(null);
      setNewReuniao({ titulo: '', data_reuniao: '', participantes: '', pauta: '', resumo: '' });
    } catch (error) {
      console.error('Erro ao registrar reunião:', error);
      alert('Erro ao registrar reunião');
    }
  };

  const handleCancelRegisterReuniao = () => {
    setShowRegisterReuniaoModal(false);
    setPendingReuniaoTask(null);
    setNewReuniao({ titulo: '', data_reuniao: '', participantes: '', pauta: '', resumo: '' });
  };

  const openReuniaoAta = (task: Task) => {
    const reuniao = reunioes.find((r) => r.id === task.reuniao_id);
    if (reuniao) {
      setEditingReuniao(reuniao);
    }
  };

  // Handlers para Reuniões (visualização/edição de atas registradas)
  const handleAddReuniao = async () => {
    if (!newReuniao.titulo.trim() || !newReuniao.data_reuniao) return;

    try {
      const reuniao = await projetoReunioesService.create(projeto.id, {
        projeto_id: projeto.id,
        titulo: newReuniao.titulo,
        data_reuniao: newReuniao.data_reuniao,
        participantes: newReuniao.participantes || undefined,
        pauta: newReuniao.pauta || undefined,
        resumo: newReuniao.resumo || undefined,
      });

      const newReuniaoMapped: Reuniao = {
        id: reuniao.id!,
        titulo: reuniao.titulo,
        data_reuniao: reuniao.data_reuniao,
        participantes: reuniao.participantes,
        pauta: reuniao.pauta,
        resumo: reuniao.resumo,
        createdAt: reuniao.data_cadastro || new Date().toISOString(),
      };

      setReunioes((prev) => [...prev, newReuniaoMapped]);
      setNewReuniao({ titulo: '', data_reuniao: '', participantes: '', pauta: '', resumo: '' });
      setShowAddReuniaoModal(false);
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
      alert('Erro ao criar reunião');
    }
  };

  const handleEditReuniao = async () => {
    if (!editingReuniao || !editingReuniao.titulo.trim()) return;

    try {
      await projetoReunioesService.update(projeto.id, editingReuniao.id, {
        titulo: editingReuniao.titulo,
        data_reuniao: editingReuniao.data_reuniao,
        participantes: editingReuniao.participantes,
        pauta: editingReuniao.pauta,
        resumo: editingReuniao.resumo,
      });

      setReunioes((prev) =>
        prev.map((r) =>
          r.id === editingReuniao.id
            ? {
                ...r,
                titulo: editingReuniao.titulo,
                data_reuniao: editingReuniao.data_reuniao,
                participantes: editingReuniao.participantes,
                pauta: editingReuniao.pauta,
                resumo: editingReuniao.resumo,
              }
            : r
        )
      );
      setEditingReuniao(null);
    } catch (error) {
      console.error('Erro ao atualizar reunião:', error);
      alert('Erro ao atualizar reunião');
    }
  };

  const handleDeleteReuniao = async (reuniaoId: string) => {
    if (confirm('Deseja excluir esta reunião?')) {
      try {
        await projetoReunioesService.delete(projeto.id, reuniaoId);
        setReunioes((prev) => prev.filter((r) => r.id !== reuniaoId));
      } catch (error) {
        console.error('Erro ao excluir reunião:', error);
        alert('Erro ao excluir reunião');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-card border border-border rounded-lg w-full max-w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-semibold">{projeto.nome}</h2>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'atividades' ? 'Quadro de Atividades' : 'Registro de Reuniões'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setActiveTab('atividades')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'atividades'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ClipboardList size={16} />
                Atividades
              </button>
              <button
                onClick={() => setActiveTab('reunioes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'reunioes'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText size={16} />
                Atas Registradas
              </button>
            </div>
            {activeTab === 'atividades' && permissions.canCreateActivity && (
              <button
                onClick={() => {
                  if (permissions.isAluno) {
                    setNewTask((prev) => ({
                      ...prev,
                      responsavel: permissions.userNome,
                    }));
                  }
                  setShowAddTaskModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={18} />
                Nova Atividade
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'atividades' ? (
            /* Kanban Board */
            <div className="h-full overflow-x-auto overflow-y-hidden p-6">
              <div className="flex gap-4 h-full w-full">
                {COLUMNS.map((column) => (
                  <div
                    key={column.id}
                    className={`flex-1 min-w-64 flex flex-col rounded-lg border-2 ${column.color}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                      <h3 className="font-semibold">{column.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        {getTasksByStatus(column.id).length}
                      </span>
                    </div>

                    {/* Tasks */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {getTasksByStatus(column.id).map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          className="bg-card border border-border rounded-lg p-3 shadow-sm cursor-move hover:shadow-md transition-shadow group"
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical
                              size={16}
                              className="text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-sm">{task.titulo}</h4>
                                {task.tipo === 'reuniao' && (
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                    <FileText size={10} />
                                    Reunião
                                  </span>
                                )}
                              </div>
                              {task.descricao && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {task.descricao}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {task.responsavel && (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <User size={12} />
                                    {task.responsavel}
                                  </span>
                                )}
                                {task.data_conclusao && (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar size={12} />
                                    {new Date(task.data_conclusao).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                            <div className="flex gap-1">
                              {column.id !== 'backlog' && (
                                <button
                                  onClick={() => moveTask(task, 'left')}
                                  className="p-1 hover:bg-muted rounded text-muted-foreground"
                                  title="Mover para esquerda"
                                >
                                  ←
                                </button>
                              )}
                              {column.id !== 'done' && (
                                <button
                                  onClick={() => moveTask(task, 'right')}
                                  className="p-1 hover:bg-muted rounded text-muted-foreground"
                                  title="Mover para direita"
                                >
                                  →
                                </button>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {task.tipo === 'reuniao' && task.status === 'done' && task.reuniao_id && (
                                <button
                                  onClick={() => openReuniaoAta(task)}
                                  className="p-1 hover:bg-muted rounded text-muted-foreground text-xs"
                                >
                                  Ver Ata
                                </button>
                              )}
                              {task.tipo === 'reuniao' && !task.reuniao_id && (
                                <button
                                  onClick={() => openRegisterReuniaoModal(task)}
                                  className="p-1 hover:bg-primary/10 text-primary rounded text-xs"
                                >
                                  Registrar
                                </button>
                              )}
                              {canEditActivity(currentUser, task.responsavel) && (
                                <button
                                  onClick={() => setEditingTask(task)}
                                  className="p-1 hover:bg-muted rounded text-muted-foreground text-xs"
                                >
                                  Editar
                                </button>
                              )}
                              {canDeleteActivity(currentUser, task.responsavel) && (
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1 hover:bg-destructive/10 text-destructive rounded text-xs"
                                >
                                  Excluir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Task Button */}
                    {permissions.canCreateActivity && (
                      <div className="p-3">
                        <button
                          onClick={() => {
                            setNewTask({
                              ...newTask,
                              status: column.id,
                              responsavel: permissions.isAluno ? permissions.userNome : newTask.responsavel,
                            });
                            setShowAddTaskModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                        >
                          <Plus size={16} />
                          Adicionar atividade
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Meetings List */
            <div className="h-full overflow-y-auto p-6">
              {reunioes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma reunião registrada</p>
                  <p className="text-sm">Crie uma atividade do tipo Reunião no quadro e mova para Done para registrar a ata</p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-4">
                  {reunioes.map((reuniao) => (
                    <div
                      key={reuniao.id}
                      className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{reuniao.titulo}</h3>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              <Calendar size={12} />
                              {new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          
                          {reuniao.participantes && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-1">Participantes:</p>
                              <p className="text-sm">{reuniao.participantes}</p>
                            </div>
                          )}
                          
                          {reuniao.pauta && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-1">Pauta:</p>
                              <p className="text-sm line-clamp-3">{reuniao.pauta}</p>
                            </div>
                          )}
                          
                          {reuniao.resumo && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-1">Resumo:</p>
                              <p className="text-sm line-clamp-3">{reuniao.resumo}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {(permissions.isProfessor || permissions.isColaborador) && (
                            <button
                              onClick={() => setEditingReuniao(reuniao)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Editar"
                            >
                              <span className="text-xs">Editar</span>
                            </button>
                          )}
                          {permissions.isProfessor && (
                            <button
                              onClick={() => handleDeleteReuniao(reuniao.id)}
                              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <span className="text-xs">Excluir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="mb-4">Nova Atividade</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">Tipo *</label>
                <select
                  value={newTask.tipo}
                  onChange={(e) => {
                    const tipo = e.target.value as AtividadeTipo;
                    setNewTask({
                      ...newTask,
                      tipo,
                      status: tipo === 'reuniao' && newTask.status === 'done' ? 'doing' : newTask.status,
                    });
                  }}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                >
                  <option value="tarefa">Tarefa</option>
                  <option value="reuniao">Reunião</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Título *</label>
                <input
                  type="text"
                  value={newTask.titulo}
                  onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg placeholder:text-muted-foreground"
                  placeholder="Nome da tarefa"
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Descrição</label>
                <textarea
                  value={newTask.descricao}
                  onChange={(e) => setNewTask({ ...newTask, descricao: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none placeholder:text-muted-foreground"
                  rows={3}
                  placeholder="Descrição da tarefa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm">Responsável</label>
                  {permissions.isAluno ? (
                    <input
                      type="text"
                      value={permissions.userNome}
                      readOnly
                      className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                    />
                  ) : (
                    <select
                      value={newTask.responsavel}
                      onChange={(e) => setNewTask({ ...newTask, responsavel: e.target.value })}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                    >
                      <option value="">Selecione...</option>
                      {membrosLista.map((membro) => (
                        <option key={membro} value={membro}>
                          {membro}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm">
                    {newTask.tipo === 'reuniao' ? 'Data Prevista' : 'Data de Conclusão'}
                  </label>
                  <input
                    type="date"
                    value={newTask.data_conclusao}
                    onChange={(e) => setNewTask({ ...newTask, data_conclusao: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm">Status Inicial</label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as ColumnType })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                >
                  {COLUMNS.filter((col) => newTask.tipo === 'tarefa' || col.id !== 'done').map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
                {newTask.tipo === 'reuniao' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao mover para Done, será aberto o registro da ata da reunião.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTask.titulo.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="mb-4">Editar Atividade</h3>
            <div className="space-y-4">
              {editingTask.tipo === 'reuniao' && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  Atividade do tipo Reunião. Ao concluir no quadro, registre a ata.
                </p>
              )}
              <div>
                <label className="block mb-2 text-sm">Título</label>
                <input
                  type="text"
                  value={editingTask.titulo}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, titulo: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Descrição</label>
                <textarea
                  value={editingTask.descricao || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, descricao: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm">Responsável</label>
                  {permissions.isAluno ? (
                    <input
                      type="text"
                      value={editingTask.responsavel || permissions.userNome}
                      readOnly
                      className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                    />
                  ) : (
                    <select
                      value={editingTask.responsavel || ''}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, responsavel: e.target.value || undefined })
                      }
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                      disabled={!permissions.canAssignActivityToOthers}
                    >
                      <option value="">Selecione...</option>
                      {membrosLista.map((membro) => (
                        <option key={membro} value={membro}>
                          {membro}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm">Data de Conclusão</label>
                  <input
                    type="date"
                    value={editingTask.data_conclusao || ''}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, data_conclusao: e.target.value || undefined })
                    }
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingTask(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditTask}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registrar Reunião (ao concluir atividade tipo reunião) */}
      {showRegisterReuniaoModal && pendingReuniaoTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="mb-1">Registrar Reunião</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A atividade &quot;{pendingReuniaoTask.titulo}&quot; foi concluída. Preencha a ata da reunião.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">Título *</label>
                <input
                  type="text"
                  value={newReuniao.titulo}
                  onChange={(e) => setNewReuniao({ ...newReuniao, titulo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Data da Reunião *</label>
                <input
                  type="date"
                  value={newReuniao.data_reuniao}
                  onChange={(e) => setNewReuniao({ ...newReuniao, data_reuniao: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Participantes</label>
                <div className="max-h-32 overflow-y-auto bg-input-background border border-border rounded-lg p-3 space-y-2">
                  {membrosLista.map((membro) => (
                    <label key={membro} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newReuniao.participantes.split(',').map(p => p.trim()).filter(Boolean).includes(membro)}
                        onChange={(e) => {
                          const currentParticipants = newReuniao.participantes.split(',').map(p => p.trim()).filter(Boolean);
                          const newParticipants = e.target.checked
                            ? [...currentParticipants, membro]
                            : currentParticipants.filter(p => p !== membro);
                          setNewReuniao({ ...newReuniao, participantes: newParticipants.join(', ') });
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{membro}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm">Pauta</label>
                <textarea
                  value={newReuniao.pauta}
                  onChange={(e) => setNewReuniao({ ...newReuniao, pauta: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Resumo / Ata *</label>
                <textarea
                  value={newReuniao.resumo}
                  onChange={(e) => setNewReuniao({ ...newReuniao, resumo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={5}
                  placeholder="Resumo da reunião, decisões tomadas, próximos passos..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCancelRegisterReuniao}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterReuniaoFromActivity}
                disabled={!newReuniao.titulo.trim() || !newReuniao.data_reuniao || !newReuniao.resumo.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Concluir e Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reunião Modal */}
      {showAddReuniaoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4">Nova Reunião</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">Título *</label>
                <input
                  type="text"
                  value={newReuniao.titulo}
                  onChange={(e) => setNewReuniao({ ...newReuniao, titulo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg placeholder:text-muted-foreground"
                  placeholder="Ex: Reunião de Planejamento"
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Data da Reunião *</label>
                <input
                  type="date"
                  value={newReuniao.data_reuniao}
                  onChange={(e) => setNewReuniao({ ...newReuniao, data_reuniao: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Participantes</label>
                <div className="max-h-32 overflow-y-auto bg-input-background border border-border rounded-lg p-3 space-y-2">
                  {membrosLista.map((membro) => (
                    <label key={membro} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newReuniao.participantes.split(',').map(p => p.trim()).filter(Boolean).includes(membro)}
                        onChange={(e) => {
                          const currentParticipants = newReuniao.participantes.split(',').map(p => p.trim()).filter(Boolean);
                          let newParticipants;
                          if (e.target.checked) {
                            newParticipants = [...currentParticipants, membro];
                          } else {
                            newParticipants = currentParticipants.filter(p => p !== membro);
                          }
                          setNewReuniao({ ...newReuniao, participantes: newParticipants.join(', ') });
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{membro}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm">Pauta</label>
                <textarea
                  value={newReuniao.pauta}
                  onChange={(e) => setNewReuniao({ ...newReuniao, pauta: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none placeholder:text-muted-foreground"
                  rows={3}
                  placeholder="Temas que foram discutidos na reunião"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Resumo / Ata</label>
                <textarea
                  value={newReuniao.resumo}
                  onChange={(e) => setNewReuniao({ ...newReuniao, resumo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none placeholder:text-muted-foreground"
                  rows={5}
                  placeholder="Resumo da reunião, decisões tomadas, próximos passos..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAddReuniaoModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddReuniao}
                disabled={!newReuniao.titulo.trim() || !newReuniao.data_reuniao}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reunião Modal */}
      {editingReuniao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4">Editar Reunião</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">Título</label>
                <input
                  type="text"
                  value={editingReuniao.titulo}
                  onChange={(e) => setEditingReuniao({ ...editingReuniao, titulo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Data da Reunião</label>
                <input
                  type="date"
                  value={editingReuniao.data_reuniao}
                  onChange={(e) => setEditingReuniao({ ...editingReuniao, data_reuniao: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Participantes</label>
                <div className="max-h-32 overflow-y-auto bg-input-background border border-border rounded-lg p-3 space-y-2">
                  {membrosLista.map((membro) => (
                    <label key={membro} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(editingReuniao.participantes || '').split(',').map(p => p.trim()).filter(Boolean).includes(membro)}
                        onChange={(e) => {
                          const currentParticipants = (editingReuniao.participantes || '').split(',').map(p => p.trim()).filter(Boolean);
                          let newParticipants;
                          if (e.target.checked) {
                            newParticipants = [...currentParticipants, membro];
                          } else {
                            newParticipants = currentParticipants.filter(p => p !== membro);
                          }
                          setEditingReuniao({ ...editingReuniao, participantes: newParticipants.join(', ') });
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{membro}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm">Pauta</label>
                <textarea
                  value={editingReuniao.pauta || ''}
                  onChange={(e) => setEditingReuniao({ ...editingReuniao, pauta: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Resumo / Ata</label>
                <textarea
                  value={editingReuniao.resumo || ''}
                  onChange={(e) => setEditingReuniao({ ...editingReuniao, resumo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={5}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingReuniao(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditReuniao}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
