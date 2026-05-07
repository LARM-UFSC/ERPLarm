import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { projetoAtividadesService, ProjetoAtividade } from '../../services/api';
import { format, addDays, differenceInDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  status: 'backlog' | 'todo' | 'doing' | 'done';
  dependencies?: string[];
  type: 'task' | 'milestone';
}

interface GanttChartProps {
  projetoId: string;
  projetoDataInicio: string;
  projetoDataPrevisao: string;
}

export function GanttChart({ projetoId, projetoDataInicio, projetoDataPrevisao }: GanttChartProps) {
  const [atividades, setAtividades] = useState<ProjetoAtividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [viewStart, setViewStart] = useState(new Date(projetoDataInicio));
  const [viewEnd, setViewEnd] = useState(new Date(projetoDataPrevisao));

  useEffect(() => {
    loadAtividades();
  }, [projetoId]);

  useEffect(() => {
    if (atividades.length > 0) {
      generateTasks();
    }
  }, [atividades]);

  const loadAtividades = async () => {
    try {
      const data = await projetoAtividadesService.getAll(projetoId);
      setAtividades(data);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = () => {
    const projetoStart = new Date(projetoDataInicio);
    const projetoEnd = new Date(projetoDataPrevisao);
    const projetoDuration = differenceInDays(projetoEnd, projetoStart);

    const generatedTasks: GanttTask[] = atividades.map((atividade, index) => {
      // Calcular datas baseadas no status e posição na lista
      let start = projetoStart;
      let end = projetoStart;
      let progress = 0;

      switch (atividade.status) {
        case 'done':
          progress = 100;
          // Concluídas: ocupam o início do cronograma
          start = addDays(projetoStart, index * 2);
          end = addDays(start, Math.max(3, projetoDuration / atividades.length));
          break;
        case 'doing':
          progress = 50;
          // Em andamento: meio do cronograma
          const midPoint = Math.floor(projetoDuration * 0.3);
          start = addDays(projetoStart, midPoint + index);
          end = addDays(start, Math.max(5, projetoDuration / atividades.length));
          break;
        case 'todo':
        case 'backlog':
        default:
          progress = 0;
          // Pendentes: final do cronograma
          const pendingStart = Math.floor(projetoDuration * 0.6);
          start = addDays(projetoStart, pendingStart + index * 2);
          end = addDays(start, Math.max(4, projetoDuration / atividades.length));
          break;
      }

      // Garantir que as datas não ultrapassem o prazo do projeto
      if (isAfter(end, projetoEnd)) {
        end = projetoEnd;
      }
      if (isAfter(start, projetoEnd)) {
        start = addDays(projetoEnd, -7); // Última semana
      }

      return {
        id: atividade.id || `task-${index}`,
        name: atividade.titulo || `Atividade ${index + 1}`,
        start,
        end,
        progress,
        status: atividade.status,
        type: atividade.titulo?.toLowerCase().includes('reunião') ? 'milestone' : 'task'
      };
    });

    setTasks(generatedTasks);
  };

  const getStatusColor = (status: 'backlog' | 'todo' | 'doing' | 'done') => {
    switch (status) {
      case 'done': return 'bg-emerald-500 dark:bg-emerald-600';
      case 'doing': return 'bg-blue-500 dark:bg-blue-600';
      case 'todo': return 'bg-amber-500 dark:bg-amber-600';
      case 'backlog': return 'bg-slate-400 dark:bg-slate-500';
      default: return 'bg-slate-400 dark:bg-slate-500';
    }
  };

  const getStatusIcon = (status: 'backlog' | 'todo' | 'doing' | 'done') => {
    switch (status) {
      case 'done': return <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />;
      case 'doing': return <Clock size={14} className="text-blue-600 dark:text-blue-400" />;
      case 'todo': return <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />;
      case 'backlog': return <AlertCircle size={14} className="text-slate-600 dark:text-slate-400" />;
      default: return <AlertCircle size={14} className="text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTaskPosition = (task: GanttTask) => {
    const totalDays = differenceInDays(viewEnd, viewStart);
    const taskStartDays = differenceInDays(task.start, viewStart);
    const taskDuration = differenceInDays(task.end, task.start) + 1;
    
    const left = Math.max(0, (taskStartDays / totalDays) * 100);
    const width = Math.min(100 - left, (taskDuration / totalDays) * 100);
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const generateTimelineDays = () => {
    const days = [];
    const totalDays = differenceInDays(viewEnd, viewStart);
    
    for (let i = 0; i <= totalDays; i += Math.ceil(totalDays / 10)) {
      days.push(addDays(viewStart, i));
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando cronograma...</p>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma atividade encontrada</h3>
            <p className="text-muted-foreground">
              Adicione atividades ao projeto para visualizar o cronograma
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Cronograma do Projeto</h3>
          <p className="text-sm text-muted-foreground">
            {format(viewStart, "dd 'de' MMMM", { locale: ptBR })} - {format(viewEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-600 rounded"></div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 dark:bg-blue-600 rounded"></div>
            <span>Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 dark:bg-amber-600 rounded"></div>
            <span>Para Fazer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded"></div>
            <span>Backlog</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Linha do tempo */}
          <div className="relative h-8 mb-2 border-b border-border">
            {generateTimelineDays().map((day, index) => (
              <div
                key={index}
                className="absolute top-0 text-xs text-muted-foreground"
                style={{
                  left: `${(differenceInDays(day, viewStart) / differenceInDays(viewEnd, viewStart)) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {format(day, 'dd/MM')}
              </div>
            ))}
          </div>

          {/* Tarefas */}
          <div className="space-y-2">
            {tasks.map((task, index) => {
              const position = getTaskPosition(task);
              return (
                <div key={task.id} className="relative h-12 flex items-center">
                  <div className="w-48 pr-4 text-sm truncate">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="font-medium">{task.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 relative h-8 bg-muted/30 rounded">
                    <div
                      className={`absolute top-1 h-6 rounded ${getStatusColor(task.status)} shadow-sm`}
                      style={position}
                    >
                      <div className="relative h-full">
                        {/* Barra de progresso */}
                        <div
                          className="absolute top-0 left-0 h-full bg-white/30 rounded"
                          style={{ width: `${100 - task.progress}%` }}
                        />
                        {/* Texto da tarefa */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-white font-medium px-2 truncate">
                            {task.progress > 0 && `${task.progress}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-24 pl-4 text-xs text-muted-foreground text-right">
                    {task.progress > 0 && (
                      <span>{Math.round(differenceInDays(task.end, task.start) + 1)}d</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Total de {tasks.length} atividades</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Concluídas: {tasks.filter(t => t.status === 'done').length}</span>
            <span>Em Andamento: {tasks.filter(t => t.status === 'doing').length}</span>
            <span>Para Fazer: {tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
