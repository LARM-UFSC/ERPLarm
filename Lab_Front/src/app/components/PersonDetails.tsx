import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, GraduationCap, Briefcase, FolderKanban, CheckCircle, Calendar, Users } from 'lucide-react';
import { Projeto, ProjetoAtividade, Aluno, Professor, Colaborador, projetosService, projetoAtividadesService } from '../../services/api';

type Pessoa = (Aluno & { tipo: 'aluno' }) | (Professor & { tipo: 'professor' }) | (Colaborador & { tipo: 'colaborador' });

interface PersonDetailsProps {
  pessoa: Pessoa;
  onBack: () => void;
  onOpenProjects: () => void;
}

interface ProjetoComAtividades extends Projeto {
  atividades: ProjetoAtividade[];
  isCoordenador: boolean;
}

export function PersonDetails({ pessoa, onBack, onOpenProjects }: PersonDetailsProps) {
  const [projetosEnvolvidos, setProjetosEnvolvidos] = useState<ProjetoComAtividades[]>([]);
  const [totalAtividadesConcluidas, setTotalAtividadesConcluidas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonData();
  }, [pessoa]);

  const loadPersonData = async () => {
    try {
      setLoading(true);
      const todosProjetos = await projetosService.getAll();
      
      // Filtra projetos onde a pessoa é coordenador ou membro
      const projetosDaPessoa = todosProjetos.filter(projeto => 
        projeto.coordenador === pessoa.nome || 
        (projeto.membros && projeto.membros.includes(pessoa.nome))
      );

      // Carrega atividades de cada projeto
      const projetosComAtividades: ProjetoComAtividades[] = await Promise.all(
        projetosDaPessoa.map(async (projeto) => {
          const atividades = await projetoAtividadesService.getAll(projeto.id);
          return {
            ...projeto,
            atividades,
            isCoordenador: projeto.coordenador === pessoa.nome,
          };
        })
      );

      // Calcula atividades concluídas da pessoa
      let concluidas = 0;
      projetosComAtividades.forEach(projeto => {
        projeto.atividades.forEach(atividade => {
          if (atividade.status === 'done' && atividade.responsavel === pessoa.nome) {
            concluidas++;
          }
        });
      });

      setProjetosEnvolvidos(projetosComAtividades);
      setTotalAtividadesConcluidas(concluidas);
    } catch (error) {
      console.error('Erro ao carregar dados da pessoa:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = () => {
    switch (pessoa.tipo) {
      case 'aluno': return <GraduationCap size={24} className="text-blue-600 dark:text-blue-400" />;
      case 'professor': return <Briefcase size={24} className="text-purple-600 dark:text-purple-400" />;
      case 'colaborador': return <User size={24} className="text-green-600 dark:text-green-400" />;
    }
  };

  const getTipoLabel = () => {
    switch (pessoa.tipo) {
      case 'aluno': return 'Aluno';
      case 'professor': return 'Professor';
      case 'colaborador': return 'Colaborador';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'em_andamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'planejamento': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
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
        <div className="flex items-center gap-3">
          <div className="p-3 bg-muted rounded-full">
            {getTipoIcon()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{pessoa.nome}</h2>
            <p className="text-muted-foreground">{getTipoLabel()}</p>
          </div>
        </div>
      </div>

      {/* Botão Acessar Projetos */}
      <div className="flex gap-3">
        <button
          onClick={onOpenProjects}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <FolderKanban size={20} />
          Ver Projetos
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FolderKanban className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Projetos</p>
              <p className="text-2xl font-bold">{projetosEnvolvidos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Atividades Concluídas</p>
              <p className="text-2xl font-bold">{totalAtividadesConcluidas}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Como Coordenador</p>
              <p className="text-2xl font-bold">
                {projetosEnvolvidos.filter(p => p.isCoordenador).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Pessoa */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Informações de Contato</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{pessoa.email || 'Não informado'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p>{pessoa.telefone || 'Não informado'}</p>
            </div>
          </div>

          {'matricula' in pessoa && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Matrícula</p>
                <p>{pessoa.matricula}</p>
              </div>
            </div>
          )}

          {'cpf' in pessoa && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p>{pessoa.cpf}</p>
              </div>
            </div>
          )}

          {'curso' in pessoa && pessoa.curso && (
            <div className="flex items-center gap-3">
              <GraduationCap size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Curso</p>
                <p>{pessoa.curso}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projetos em que está envolvido */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Projetos em que está envolvido</h3>
        
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : projetosEnvolvidos.length > 0 ? (
          <div className="space-y-4">
            {projetosEnvolvidos.map((projeto) => (
              <div key={projeto.id} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-lg">{projeto.nome}</p>
                      {projeto.isCoordenador && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs rounded-full">
                          Coordenador
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {projeto.descricao || 'Sem descrição'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(projeto.status)}`}>
                    {projeto.status === 'concluido' ? 'Concluído' : 
                     projeto.status === 'em_andamento' ? 'Em Andamento' : 
                     projeto.status === 'planejamento' ? 'Planejamento' : projeto.status}
                  </span>
                </div>

                {/* Resumo de atividades do projeto */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium">{projeto.atividades.length}</span>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <span className="text-muted-foreground">Em andamento: </span>
                    <span className="font-medium">
                      {projeto.atividades.filter(a => a.status === 'doing').length}
                    </span>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                    <span className="text-muted-foreground">Concluídas: </span>
                    <span className="font-medium">
                      {projeto.atividades.filter(a => a.status === 'done').length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum projeto encontrado</p>
        )}
      </div>

      {/* Atividades da Pessoa */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Minhas Atividades Concluídas</h3>
        
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {projetosEnvolvidos.flatMap(projeto => 
              projeto.atividades
                .filter(a => a.responsavel === pessoa.nome && a.status === 'done')
                .map(atividade => ({ ...atividade, projetoNome: projeto.nome }))
            ).length > 0 ? (
              projetosEnvolvidos.flatMap(projeto => 
                projeto.atividades
                  .filter(a => a.responsavel === pessoa.nome && a.status === 'done')
                  .map(atividade => ({ ...atividade, projetoNome: projeto.nome }))
              ).map((atividade, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <div>
                    <p className="font-medium">{atividade.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      Projeto: {atividade.projetoNome}
                    </p>
                  </div>
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nenhuma atividade concluída</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
