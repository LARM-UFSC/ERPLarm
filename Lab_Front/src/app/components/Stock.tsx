import { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { materialConsumoService, MaterialConsumo } from '../../services/api';

interface StockItem {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  maxStock: number;
  location: string;
  lastUpdate: string;
}

export function Stock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok'>('all');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setStockItems([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const consumoData = await materialConsumoService.getAll();

      // Mapear MaterialConsumo para StockItem
      const stockData: StockItem[] = consumoData.map((material) => ({
        id: material.id,
        code: material.id.slice(0, 8).toUpperCase(),
        name: material.descricao,
        category: material.tipo,
        stock: material.quantidade,
        minStock: 5, // Estoque mínimo padrão
        maxStock: Math.max(material.quantidade * 2, 10), // Estoque máximo dinâmico
        location: 'LAB-01', // Localização padrão
        lastUpdate: material.data_atualizacao || material.data_cadastro,
      }));

      setStockItems(stockData);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadStockData = async () => {
    try {
      setLoading(true);
      const consumoData = await materialConsumoService.getAll();

      // Mapear MaterialConsumo para StockItem
      const stockData: StockItem[] = consumoData.map((material) => ({
        id: material.id,
        code: material.id.slice(0, 8).toUpperCase(),
        name: material.descricao,
        category: material.tipo,
        stock: material.quantidade,
        minStock: 5, // Estoque mínimo padrão
        maxStock: Math.max(material.quantidade * 2, 10), // Estoque máximo dinâmico
        location: 'LAB-01', // Localização padrão
        lastUpdate: material.data_atualizacao || material.data_cadastro,
      }));

      setStockItems(stockData);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'low') {
      return matchesSearch && item.stock <= item.minStock;
    } else if (filterStatus === 'ok') {
      return matchesSearch && item.stock > item.minStock;
    }
    return matchesSearch;
  });

  const lowStockCount = stockItems.filter(item => item.stock <= item.minStock).length;
  const okStockCount = stockItems.filter(item => item.stock > item.minStock).length;

  return (
    <div className="space-y-6">
      <div>
        <h2>Controle de Estoque</h2>
        <p className="text-muted-foreground mt-1">Acompanhamento dos níveis de estoque</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total de Itens</p>
              <h3 className="mt-2">{stockItems.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Estoque Baixo</p>
              <h3 className="mt-2 text-yellow-600">{lowStockCount}</h3>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Estoque OK</p>
              <h3 className="mt-2 text-green-600">{okStockCount}</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-input-background rounded-lg flex-1">
            <Search size={20} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar material..."
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

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Todos ({stockItems.length})
          </button>
          <button
            onClick={() => setFilterStatus('low')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'low'
                ? 'bg-yellow-600 text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Estoque Baixo ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterStatus('ok')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'ok'
                ? 'bg-green-600 text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Estoque OK ({okStockCount})
          </button>
        </div>
      </div>

      {!hasSearched ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Faça uma busca para encontrar materiais</h3>
          <p className="text-muted-foreground">Use o campo de busca acima para procurar materiais por nome, código ou categoria.</p>
        </div>
      ) : (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4">Código</th>
                <th className="text-left px-6 py-4">Material</th>
                <th className="text-left px-6 py-4">Categoria</th>
                <th className="text-center px-6 py-4">Localização</th>
                <th className="text-right px-6 py-4">Estoque Atual</th>
                <th className="text-right px-6 py-4">Est. Mínimo</th>
                <th className="text-right px-6 py-4">Est. Máximo</th>
                <th className="text-center px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isLowStock = item.stock <= item.minStock;
                const percentFilled = (item.stock / item.maxStock) * 100;

                return (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 font-mono text-sm bg-muted px-2 py-1 rounded">
                        {item.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        <Package size={14} />
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-8 bg-muted rounded font-mono text-sm">
                        {item.location}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={isLowStock ? 'text-yellow-600 font-medium' : 'font-medium'}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{item.minStock}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{item.maxStock}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            <AlertTriangle size={14} />
                            Baixo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                            <CheckCircle size={14} />
                            OK
                          </span>
                        )}
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              isLowStock ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(percentFilled, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={48} className="opacity-50" />
                      <p>Nenhum item no estoque</p>
                      <p className="text-sm">Cadastre materiais para visualizar o estoque</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
