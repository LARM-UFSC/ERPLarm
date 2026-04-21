import { useState, useEffect } from 'react';
import { X, Plus, GripVertical, ArrowLeft, Calendar, User, FileText, ClipboardList } from 'lucide-react';
import { Projeto, ProjetoAtividade, ProjetoReuniao, projetoAtividadesService, projetoReunioesService } from '../../services/api';

interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'backlog' | 'todo' | 'doing' | 'done';
  responsavel?: string;
  data_conclusao?: string;
  createdAt: string;
}

type ColumnType = 'backlog' | 'todo' | 'doing' | 'done';

interface Column {
  id: ColumnType;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-100 border-slate-300' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-50 border-blue-300' },
  { id: 'doing', title: 'Doing', color: 'bg-yellow-50 border-yellow-300' },
  { id: 'done', title: 'Done', color: 'bg-green-50 border-green-300' },
];

interface ProjectBoardProps {
  projeto: Projeto;
  membros: string[];
  onClose: () => void;
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

export function ProjectBoard({ projeto, membros, onClose }: ProjectBoardProps) {
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
  });

  // Estados para Reuniões
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
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
  }, [projeto.id]);

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const atividades = await projetoAtividadesService.getAll(projeto.id);
      const mappedTasks: Task[] = atividades.map((a) => ({
        id: a.id!,
        titulo: a.titulo,
        descricao: a.descricao,
        status: a.status,
        responsavel: a.responsavel,
        data_conclusao: a.data_conclusao,
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

  const handleDrop = (e: React.DragEvent, status: ColumnType) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      setTasks((prev) =>
        prev.map((t) => (t.id === draggedTask.id ? { ...t, status } : t))
      );
      setDraggedTask(null);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.titulo.trim()) return;

    try {
      const atividade = await projetoAtividadesService.create(projeto.id, {
        titulo: newTask.titulo,
        descricao: newTask.descricao,
        status: newTask.status,
        responsavel: newTask.responsavel || undefined,
        data_conclusao: newTask.data_conclusao || undefined,
      });

      const task: Task = {
        id: atividade.id!,
        titulo: atividade.titulo,
        descricao: atividade.descricao,
        status: atividade.status,
        responsavel: atividade.responsavel,
        data_conclusao: atividade.data_conclusao,
        createdAt: atividade.data_cadastro || new Date().toISOString(),
      };

      setTasks((prev) => [...prev, task]);
      setNewTask({ titulo: '', descricao: '', responsavel: '', data_conclusao: '', status: 'backlog' });
      setShowAddTaskModal(false);
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      alert('Erro ao criar atividade');
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !editingTask.titulo.trim()) return;

    try {
      await projetoAtividadesService.update(projeto.id, editingTask.id, {
        titulo: editingTask.titulo,
        descricao: editingTask.descricao,
        status: editingTask.status,
        responsavel: editingTask.responsavel,
        data_conclusao: editingTask.data_conclusao,
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                titulo: editingTask.titulo,
                descricao: editingTask.descricao,
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
    let newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < COLUMNS.length) {
      const newStatus = COLUMNS[newIndex].id;
      try {
        await projetoAtividadesService.update(projeto.id, task.id, {
          titulo: task.titulo,
          descricao: task.descricao,
          status: newStatus,
          responsavel: task.responsavel,
          data_conclusao: task.data_conclusao,
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );
      } catch (error) {
        console.error('Erro ao mover atividade:', error);
      }
    }
  };

  // Handlers para Reuniões
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
                Reuniões
              </button>
            </div>
            {activeTab === 'atividades' ? (
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={18} />
                Nova Tarefa
              </button>
            ) : (
              <button
                onClick={() => setShowAddReuniaoModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={18} />
                Nova Reunião
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
                              <h4 className="font-medium text-sm">{task.titulo}</h4>
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
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground text-xs"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 hover:bg-destructive/10 text-destructive rounded text-xs"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Task Button */}
                    <div className="p-3">
                      <button
                        onClick={() => {
                          setNewTask({ ...newTask, status: column.id });
                          setShowAddTaskModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                      >
                        <Plus size={16} />
                        Adicionar tarefa
                      </button>
                    </div>
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
                  <p className="text-sm">Clique em "Nova Reunião" para adicionar</p>
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
                          <button
                            onClick={() => setEditingReuniao(reuniao)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Editar"
                          >
                            <span className="text-xs">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReuniao(reuniao.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <span className="text-xs">Excluir</span>
                          </button>
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
            <h3 className="mb-4">Nova Tarefa</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">Título *</label>
                <input
                  type="text"
                  value={newTask.titulo}
                  onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  placeholder="Nome da tarefa"
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Descrição</label>
                <textarea
                  value={newTask.descricao}
                  onChange={(e) => setNewTask({ ...newTask, descricao: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={3}
                  placeholder="Descrição da tarefa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm">Responsável</label>
                  <select
                    value={newTask.responsavel}
                    onChange={(e) => setNewTask({ ...newTask, responsavel: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {membros.map((membro) => (
                      <option key={membro} value={membro}>
                        {membro}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm">Data de Conclusão</label>
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
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
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
            <h3 className="mb-4">Editar Tarefa</h3>
            <div className="space-y-4">
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
                  <select
                    value={editingTask.responsavel || ''}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, responsavel: e.target.value || undefined })
                    }
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {membros.map((membro) => (
                      <option key={membro} value={membro}>
                        {membro}
                      </option>
                    ))}
                  </select>
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
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
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
                  {membros.map((membro) => (
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
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={3}
                  placeholder="Temas que foram discutidos na reunião"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Resumo / Ata</label>
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
                  {membros.map((membro) => (
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
