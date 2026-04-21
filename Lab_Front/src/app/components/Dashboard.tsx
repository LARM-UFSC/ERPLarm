import { useState, useEffect } from 'react';
import {
  Package, Users, BookOpen, GraduationCap, Briefcase, FolderKanban,
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity, ArrowUpRight,
  ArrowDownRight, Calendar, Layers, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  Legend
} from 'recharts';
import { statsService, materialConsumoService, projetosService, Stats, MaterialConsumo, Projeto } from "../../services/api";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [materiais, setMateriais] = useState<MaterialConsumo[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, materiaisData, projetosData] = await Promise.all([
        statsService.get(),
        materialConsumoService.getAll(),
        projetosService.getAll()
      ]);
      setStats(statsData);
      setMateriais(materiaisData);
      setProjetos(projetosData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dados para gráficos
  const pessoasData = [
    { name: 'Alunos', value: stats?.alunos || 0, color: '#3b82f6' },
    { name: 'Professores', value: stats?.professores || 0, color: '#10b981' },
    { name: 'Colaboradores', value: stats?.colaboradores || 0, color: '#8b5cf6' },
  ];

  const materiaisData = [
    { name: 'Consumo', quantidade: stats?.material_consumo || 0, itens: stats?.total_items_consumo || 0 },
    { name: 'Permanente', quantidade: stats?.material_permanente || 0, itens: stats?.material_permanente || 0 },
  ];

  const materiaisPorTipo = materiais.reduce((acc, m) => {
    acc[m.tipo] = (acc[m.tipo] || 0) + m.quantidade;
    return acc;
  }, {} as Record<string, number>);

  const materiaisTipoData = Object.entries(materiaisPorTipo)
    .map(([tipo, quantidade]) => ({ name: tipo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 8);

  // Dados simulados para consumo por projeto (enquanto não temos tabela de movimentações)
  const consumoPorProjeto = projetos.slice(0, 6).map((proj, i) => {
    const consumoSimulado = Math.floor(Math.random() * 50) + 10;
    return {
      name: proj.nome.substring(0, 20),
      consumo: consumoSimulado,
      previsto: Math.floor(consumoSimulado * 1.2),
      status: proj.status
    };
  });

  const statusProjetoData = [
    { name: 'Planejamento', value: projetos.filter(p => p.status === 'planejamento').length },
    { name: 'Em Andamento', value: projetos.filter(p => p.status === 'em_andamento').length },
    { name: 'Pausado', value: projetos.filter(p => p.status === 'pausado').length },
    { name: 'Concluído', value: projetos.filter(p => p.status === 'concluido').length },
    { name: 'Cancelado', value: projetos.filter(p => p.status === 'cancelado').length },
  ].filter(s => s.value > 0);

  const trendData = [
    { mes: 'Jan', cadastros: 12, consumo: 45 },
    { mes: 'Fev', cadastros: 18, consumo: 52 },
    { mes: 'Mar', cadastros: 15, consumo: 38 },
    { mes: 'Abr', cadastros: 22, consumo: 65 },
    { mes: 'Mai', cadastros: 28, consumo: 72 },
    { mes: 'Jun', cadastros: 35, consumo: 58 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
        </div>
        <div className="text-center py-12">
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted-foreground mt-1">Visão geral do sistema de gestão</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} />
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Pessoas"
          value={(stats?.alunos || 0) + (stats?.professores || 0) + (stats?.colaboradores || 0)}
          icon={Users}
          trend={+12}
          trendLabel="vs mês anterior"
          color="blue"
        />
        <KPICard
          title="Material em Estoque"
          value={stats?.total_items_consumo || 0}
          icon={Package}
          trend={-5}
          trendLabel="vs mês anterior"
          color="orange"
        />
        <KPICard
          title="Projetos Ativos"
          value={projetos.filter(p => p.status === 'em_andamento').length}
          icon={FolderKanban}
          trend={+3}
          trendLabel="novos este mês"
          color="green"
        />
        <KPICard
          title="Total de Materiais"
          value={(stats?.material_consumo || 0) + (stats?.material_permanente || 0)}
          icon={Layers}
          trend={+8}
          trendLabel="cadastros este mês"
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição de Pessoas */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="text-primary" size={20} />
            <h3 className="font-semibold">Distribuição de Pessoas</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pessoasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pessoasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Materiais por Tipo */}
        <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-primary" size={20} />
            <h3 className="font-semibold">Materiais de Consumo por Tipo</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materiaisTipoData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Relatório de Consumo por Projeto */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            <h3 className="font-semibold">Relatório de Consumo por Projeto</h3>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            <FileText size={16} />
            Exportar Relatório
          </button>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consumoPorProjeto}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="consumo" name="Consumo Real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="previsto" name="Consumo Previsto" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">Total Consumido</p>
            <p className="text-2xl font-bold text-blue-600">
              {consumoPorProjeto.reduce((acc, p) => acc + p.consumo, 0)} un
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">Total Previsto</p>
            <p className="text-2xl font-bold text-green-600">
              {consumoPorProjeto.reduce((acc, p) => acc + p.previsto, 0)} un
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">Eficiência</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round((consumoPorProjeto.reduce((acc, p) => acc + p.consumo, 0) /
                consumoPorProjeto.reduce((acc, p) => acc + p.previsto, 0)) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Projetos */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="text-primary" size={20} />
            <h3 className="font-semibold">Status dos Projetos</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={statusProjetoData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusProjetoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendência de Cadastros e Consumo */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-primary" size={20} />
            <h3 className="font-semibold">Tendência - Cadastros vs Consumo</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="cadastros" name="Novos Cadastros" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="consumo" name="Consumo (un)" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Alunos"
          value={stats?.alunos || 0}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Professores"
          value={stats?.professores || 0}
          icon={GraduationCap}
          color="green"
        />
        <StatCard
          title="Colaboradores"
          value={stats?.colaboradores || 0}
          icon={Briefcase}
          color="purple"
        />
      </div>
    </div>
  );
}

// Componente de KPI Card
function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color
}: {
  title: string;
  value: number;
  icon: typeof Package;
  trend: number;
  trendLabel: string;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; light: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
    green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
    red: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
  };

  const colors = colorClasses[color];
  const TrendIcon = trend >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`${colors.light} p-3 rounded-xl`}>
          <Icon className={colors.text} size={24} />
        </div>
        <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendIcon size={16} />
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="mt-4">
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
      </div>
    </div>
  );
}

// Componente de Stat Card Simples
function StatCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  icon: typeof Package;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
