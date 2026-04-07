import { useState, useEffect } from 'react';
import { Package, TrendingDown, TrendingUp, AlertTriangle, User, BookOpen, GraduationCap, Briefcase } from 'lucide-react';
import { statsService, Stats } from "../../services/api";

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Carregando estatísticas do dashboard...');
      const statsData = await statsService.get();
      console.log('Estatísticas carregadas:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted-foreground mt-1">Visão geral do sistema acadêmico</p>
        </div>
        <div className="text-center py-12">
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard</h2>
        <p className="text-muted-foreground mt-1">Visão geral do sistema acadêmico</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Alunos</p>
              <h3 className="mt-2">{stats?.alunos || 0}</h3>
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
              <h3 className="mt-2">{stats?.professores || 0}</h3>
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
              <h3 className="mt-2">{stats?.colaboradores || 0}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Briefcase className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Materiais</p>
              <h3 className="mt-2">{(stats?.material_consumo || 0) + (stats?.material_permanente || 0)}</h3>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Package className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="mb-4">Resumo de Pessoas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Alunos Cadastrados</span>
              <span className="font-medium text-blue-600">{stats?.alunos || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Professores Cadastrados</span>
              <span className="font-medium text-green-600">{stats?.professores || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Colaboradores Cadastrados</span>
              <span className="font-medium text-purple-600">{stats?.colaboradores || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Pessoas</span>
              <span className="font-medium">
                {(stats?.alunos || 0) + (stats?.professores || 0) + (stats?.colaboradores || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="mb-4">Resumo de Materiais</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Material de Consumo</span>
              <span className="font-medium text-orange-600">{stats?.material_consumo || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Material Permanente</span>
              <span className="font-medium text-red-600">{stats?.material_permanente || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Itens em Consumo</span>
              <span className="font-medium text-yellow-600">{stats?.total_items_consumo || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Materiais</span>
              <span className="font-medium">
                {(stats?.material_consumo || 0) + (stats?.material_permanente || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Alunos</h3>
            <BookOpen className="text-blue-600" size={20} />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{stats?.alunos || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Cadastrados</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Professores</h3>
            <GraduationCap className="text-green-600" size={20} />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.professores || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Cadastrados</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Colaboradores</h3>
            <Briefcase className="text-purple-600" size={20} />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{stats?.colaboradores || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Cadastrados</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Material de Consumo</h3>
            <Package className="text-orange-600" size={20} />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{stats?.material_consumo || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Tipos cadastrados</p>
            <p className="text-lg font-semibold text-yellow-600 mt-2">{stats?.total_items_consumo || 0}</p>
            <p className="text-sm text-muted-foreground">Total de itens</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Material Permanente</h3>
            <Package className="text-red-600" size={20} />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{stats?.material_permanente || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Itens patrimoniados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
