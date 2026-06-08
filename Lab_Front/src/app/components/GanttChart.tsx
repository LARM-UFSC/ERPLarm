import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { projetoAtividadesService, ProjetoAtividade } from '../../services/api';
import { format, addDays, differenceInDays, isAfter, isBefore, subMonths, addMonths, startOfDay } from 'date-fns';
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
  
  // Alterado para 2 meses antes e 2 meses depois da data atual (Janela total de 4 meses)
  const [viewStart] = useState(() => startOfDay(subMonths(new Date(), 2)));
  const [viewEnd] = useState(() => startOfDay(addMonths(new Date(), 2)));

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
    const generatedTasks: GanttTask[] = atividades.map((atividade, index) => {
      const dataCadastroRaw = (atividade as any).data_cadastro;
      const dataConclusaoRaw = (atividade as any).data_conclusao;

      let start = dataCadastroRaw ? startOfDay(new Date(dataCadastroRaw)) : startOfDay(new Date(projetoDataInicio));
      let end = dataConclusaoRaw ? startOfDay(new Date(dataConclusaoRaw)) : addDays(start, 3);

      if (isNaN(start.getTime())) start = startOfDay(new Date(projetoDataInicio));
      if (isNaN(end.getTime())) end = startOfDay(new Date(projetoDataPrevisao));
      if (isBefore(end, start)) end = start;

      let progress = 0;
      if (atividade.status === 'done') progress = 100;
      if (atividade.status === 'doing') progress = 50;

      return {
        id: atividade.id || `task-${index}`,
        name: atividade.titulo || `Atividade ${index + 1}`,
        start,
        end,
        progress,
        status: atividade.status as GanttTask['status'],
        type: atividade.tipo === 'reuniao' ? 'milestone' : 'task'
      };
    });

    // Filtra tarefas fora do escopo de 4 meses
    const filteredTasks = generatedTasks.filter(task => {
      return !(isAfter(task.start, viewEnd) || isBefore(task.end, viewStart));
    });

    filteredTasks.sort((a, b) => a.start.getTime() - b.start.getTime());
    setTasks(filteredTasks);
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
      case 'done': return <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
      case 'doing': return <Clock size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />;
      case 'todo': return <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />;
      case 'backlog': return <AlertCircle size={14} className="text-slate-600 dark:text-slate-400 flex-shrink-0" />;
      default: return <AlertCircle size={14} className="text-slate-600 dark:text-slate-400 flex-shrink-0" />;
    }
  };

  const getTaskPosition = (task: GanttTask) => {
    const totalViewportDays = differenceInDays(viewEnd, viewStart);
    
    let renderStart = task.start;
    let renderEnd = task.end;

    if (isBefore(renderStart, viewStart)) renderStart = viewStart;
    if (isAfter(renderEnd, viewEnd)) renderEnd = viewEnd;

    const taskStartDays = differenceInDays(renderStart, viewStart);
    const taskDuration = differenceInDays(renderEnd, renderStart) + 1;
    
    const left = (taskStartDays / totalViewportDays) * 100;
    const width = (taskDuration / totalViewportDays) * 100;
    
    return { 
      left: `${Math.max(0, left)}%`, 
      width: `${Math.max(0.5, Math.min(100 - left, width))}%` 
    };
  };

  // Ajustado o step para 10 dias. Fica perfeito e bem espaçado na janela de 4 meses.
  const generateTimelineDays = () => {
    const days = [];
    const totalDays = differenceInDays(viewEnd, viewStart);
    const step = 10; 
    
    for (let i = 0; i <= totalDays; i += step) {
      days.push(addDays(viewStart, i));
    }
    
    if (days.length > 0 && differenceInDays(days[days.length - 1], viewEnd) !== 0) {
      days.push(viewEnd);
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Ajustando foco do cronograma...</p>
          </div>
        </div>
      </div>
    );
  }

  const timelineDays = generateTimelineDays();
  const totalProjectDays = differenceInDays(viewEnd, viewStart) || 1;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Cronograma do Projeto</h3>
          <p className="text-sm text-muted-foreground">
            Janela de foco ampliada: {format(viewStart, "dd/MM/yyyy")} até {format(viewEnd, "dd/MM/yyyy")} (-2M / +2M)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span>Para Fazer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-400 rounded"></div>
            <span>Backlog</span>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-md">
          <p className="text-muted-foreground">Nenhuma atividade registrada nesta janela de 4 meses.</p>
        </div>
      ) : (
        /* Tabela Gantt */
        <div className="overflow-x-auto border border-border rounded-md shadow-sm">
          <div className="min-w-[1050px] divide-y divide-border bg-background">
            
            {/* RÉGUA DO TEMPO */}
            <div className="grid grid-cols-[240px_1fr_90px] items-center bg-muted/50 h-10 font-medium">
              <div className="px-4 text-xs uppercase tracking-wider text-muted-foreground border-r border-border h-full flex items-center">
                Atividade
              </div>
              
              <div className="relative h-full w-full overflow-hidden">
                {timelineDays.map((day, index) => {
                  const percentage = (differenceInDays(day, viewStart) / totalProjectDays) * 100;
                  const isLast = index === timelineDays.length - 1;
                  return (
                    <div
                      key={index}
                      className="absolute top-0 text-[10px] text-muted-foreground h-full flex items-center border-l border-border/60 pl-1 whitespace-nowrap"
                      style={{ 
                        left: `${percentage}%`,
                        transform: isLast ? 'translateX(-100%)' : 'none',
                      }}
                    >
                      {format(day, 'dd/MM')}
                    </div>
                  );
                })}
              </div>

              <div className="px-2 text-center text-xs uppercase tracking-wider text-muted-foreground border-l border-border h-full flex items-center justify-center">
                Duração
              </div>
            </div>

            {/* CORPO DE ATIVIDADES */}
            <div className="divide-y divide-border/60">
              {tasks.map((task) => {
                const position = getTaskPosition(task);
                const durationDays = Math.round(differenceInDays(task.end, task.start) + 1);
                const taskTitleTooltip = `${task.name}\nCadastro: ${format(task.start, 'dd/MM/yyyy')}\nConclusão: ${format(task.end, 'dd/MM/yyyy')}\nDuração: ${durationDays} dia(s)`;

                return (
                  <div 
                    key={task.id} 
                    className="grid grid-cols-[240px_1fr_90px] items-center hover:bg-muted/20 h-12 transition-colors group"
                    title={taskTitleTooltip}
                  >
                    
                    <div className="px-4 text-sm border-r border-border h-full flex items-center min-w-0">
                      <div className="flex items-center gap-2 min-w-0 w-full">
                        {getStatusIcon(task.status)}
                        <span className="font-medium text-foreground truncate" title={task.name}>
                          {task.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative h-full flex items-center bg-muted/5 w-full overflow-hidden">
                      {/* Linhas guias verticais (A cada 10 dias agora) */}
                      {timelineDays.map((day, idx) => (
                        <div 
                          key={`line-${idx}`} 
                          className="absolute top-0 bottom-0 border-l border-border/30 pointer-events-none"
                          style={{ left: `${(differenceInDays(day, viewStart) / totalProjectDays) * 100}%` }}
                        />
                      ))}

                      {/* Barra Estendida de Gantt */}
                      <div
                        className={`absolute h-7 rounded ${getStatusColor(task.status)} shadow-sm transition-all duration-300 group-hover:brightness-95`}
                        style={position}
                      >
                        <div className="relative h-full w-full overflow-hidden rounded">
                          <div
                            className="absolute top-0 right-0 bottom-0 bg-black/15 transition-all"
                            style={{ width: `${100 - task.progress}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center px-1">
                            {task.progress > 0 && durationDays > 2 && (
                              <span className="text-[10px] text-white font-bold drop-shadow-sm pointer-events-none">
                                {task.progress}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center text-xs text-muted-foreground border-l border-border h-full flex items-center justify-center font-semibold bg-background z-10">
                      {durationDays}d
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}