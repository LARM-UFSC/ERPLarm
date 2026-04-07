import { useState, useEffect } from 'react';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';

interface Movement {
  id: number;
  type: 'entrada' | 'saida';
  materialCode: string;
  materialName: string;
  quantity: number;
  date: string;
  user: string;
  observation: string;
}

export function Movements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida'>('all');
  const [showModal, setShowModal] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Por enquanto, movimentações são gerenciadas localmente
    // Quando houver endpoint na API, descomentar:
    // loadMovements();
    setLoading(false);
  }, []);

  const loadMovements = async () => {
    try {
      setLoading(true);
      // const data = await movementsService.getAll();
      // setMovements(data);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    type: 'entrada' as 'entrada' | 'saida',
    materialCode: '',
    materialName: '',
    quantity: '',
    observation: '',
  });

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch = movement.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.user.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    return matchesSearch && movement.type === filterType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newMovement: Movement = {
      id: movements.length + 1,
      type: formData.type,
      materialCode: formData.materialCode,
      materialName: formData.materialName,
      quantity: Number(formData.quantity),
      date: new Date().toISOString().split('T')[0],
      user: 'Usuário Atual',
      observation: formData.observation,
    };

    setMovements([newMovement, ...movements]);
    setShowModal(false);
    setFormData({ type: 'entrada', materialCode: '', materialName: '', quantity: '', observation: '' });
  };

  const entryCount = movements.filter(m => m.type === 'entrada').length;
  const exitCount = movements.filter(m => m.type === 'saida').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Movimentações de Estoque</h2>
          <p className="text-muted-foreground mt-1">Registro de entradas e saídas de materiais</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Nova Movimentação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Movimentações</p>
              <h3 className="mt-2">{movements.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Entradas</p>
              <h3 className="mt-2 text-green-600">{entryCount}</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <ArrowUpCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Saídas</p>
              <h3 className="mt-2 text-red-600">{exitCount}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <ArrowDownCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-input-background rounded-lg">
          <Search size={20} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar movimentação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Todas ({movements.length})
          </button>
          <button
            onClick={() => setFilterType('entrada')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'entrada'
                ? 'bg-green-600 text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Entradas ({entryCount})
          </button>
          <button
            onClick={() => setFilterType('saida')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'saida'
                ? 'bg-red-600 text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Saídas ({exitCount})
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-center px-6 py-4">Tipo</th>
                <th className="text-left px-6 py-4">Código</th>
                <th className="text-left px-6 py-4">Material</th>
                <th className="text-right px-6 py-4">Quantidade</th>
                <th className="text-left px-6 py-4">Data</th>
                <th className="text-left px-6 py-4">Usuário</th>
                <th className="text-left px-6 py-4">Observação</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {movement.type === 'entrada' ? (
                        <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1 rounded">
                          <ArrowUpCircle size={16} />
                          Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm bg-red-100 text-red-700 px-3 py-1 rounded">
                          <ArrowDownCircle size={16} />
                          Saída
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 font-mono text-sm bg-muted px-2 py-1 rounded">
                      {movement.materialCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">{movement.materialName}</td>
                  <td className="px-6 py-4 text-right font-medium">{movement.quantity}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(movement.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{movement.user}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{movement.observation}</td>
                </tr>
              ))}
              {filteredMovements.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowUpCircle size={48} className="opacity-50" />
                      <p>Nenhuma movimentação registrada</p>
                      <p className="text-sm">Clique em "Nova Movimentação" para adicionar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl">
            <h3 className="mb-4">Nova Movimentação</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Tipo de Movimentação</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'entrada' | 'saida' })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Código do Material</label>
                  <input
                    type="text"
                    value={formData.materialCode}
                    onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                    placeholder="Ex: MAT001"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Quantidade</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">Nome do Material</label>
                <input
                  type="text"
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Observação</label>
                <textarea
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                  rows={3}
                  placeholder="Motivo da movimentação..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
