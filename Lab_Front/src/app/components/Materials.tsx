import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { materialConsumoService, materialPermanenteService, MaterialConsumo, MaterialPermanente } from '../../services/api';

interface FormData {
  tipo: string;
  descricao: string;
  quantidade: string;
  patrimonio: string;
  modelo: string;
  marca: string;
}

export function Materials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialConsumo | MaterialPermanente | null>(null);
  const [materialType, setMaterialType] = useState<'consumo' | 'permanente'>('consumo');
  const [materialConsumo, setMaterialConsumo] = useState<MaterialConsumo[]>([]);
  const [materialPermanente, setMaterialPermanente] = useState<MaterialPermanente[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    tipo: '',
    descricao: '',
    quantidade: '',
    patrimonio: '',
    modelo: '',
    marca: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [consumoData, permanenteData] = await Promise.all([
        materialConsumoService.getAll(),
        materialPermanenteService.getAll()
      ]);
      
      setMaterialConsumo(consumoData);
      setMaterialPermanente(permanenteData);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterialConsumo = materialConsumo.filter((material) =>
    material.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterialPermanente = materialPermanente.filter((material) =>
    material.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (materialType === 'consumo') {
        const materialData = {
          tipo: formData.tipo,
          descricao: formData.descricao,
          quantidade: parseInt(formData.quantidade),
        };

        if (editingMaterial) {
          await materialConsumoService.update(editingMaterial.id, materialData as any);
        } else {
          await materialConsumoService.create(materialData);
        }
      } else {
        const materialData = {
          tipo: formData.tipo,
          patrimonio: formData.patrimonio,
          modelo: formData.modelo || undefined,
          marca: formData.marca || undefined,
          descricao: formData.descricao || undefined,
        };

        if (editingMaterial) {
          await materialPermanenteService.update(editingMaterial.id, materialData as any);
        } else {
          await materialPermanenteService.create(materialData);
        }
      }

      await loadData();
      setShowModal(false);
      setEditingMaterial(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      alert('Erro ao salvar material. Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (material: MaterialConsumo | MaterialPermanente, type: 'consumo' | 'permanente') => {
    setEditingMaterial(material);
    setMaterialType(type);
    
    if (type === 'consumo') {
      const consumoMaterial = material as MaterialConsumo;
      setFormData({
        tipo: consumoMaterial.tipo,
        descricao: consumoMaterial.descricao,
        quantidade: consumoMaterial.quantidade.toString(),
        patrimonio: '',
        modelo: '',
        marca: '',
      });
    } else {
      const permanenteMaterial = material as MaterialPermanente;
      setFormData({
        tipo: permanenteMaterial.tipo,
        descricao: permanenteMaterial.descricao || '',
        quantidade: '',
        patrimonio: permanenteMaterial.patrimonio,
        modelo: permanenteMaterial.modelo || '',
        marca: permanenteMaterial.marca || '',
      });
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: string, type: 'consumo' | 'permanente') => {
    if (confirm('Deseja realmente excluir este material?')) {
      try {
        if (type === 'consumo') {
          await materialConsumoService.delete(id);
        } else {
          await materialPermanenteService.delete(id);
        }
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir material:', error);
        alert('Erro ao excluir material.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: '',
      descricao: '',
      quantidade: '',
      patrimonio: '',
      modelo: '',
      marca: '',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Gestão de Materiais</h2>
            <p className="text-muted-foreground mt-1">Cadastro e controle de materiais</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p>Carregando materiais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestão de Materiais</h2>
          <p className="text-muted-foreground mt-1">Cadastro e controle de materiais</p>
        </div>
        <button
          onClick={() => {
            setEditingMaterial(null);
            setMaterialType('consumo');
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Novo Material
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Material Consumo</p>
              <h3 className="mt-2">{materialConsumo.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Material Permanente</p>
              <h3 className="mt-2 text-blue-600">{materialPermanente.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Itens Consumo</p>
              <h3 className="mt-2 text-green-600">
                {materialConsumo.reduce((sum, m) => sum + m.quantidade, 0)}
              </h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Tipos Cadastrados</p>
              <h3 className="mt-2 text-purple-600">
                {new Set([...materialConsumo.map(m => m.tipo), ...materialPermanente.map(m => m.tipo)]).size}
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-input-background rounded-lg">
          <Search size={20} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por tipo, descrição, patrimônio, modelo ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold">Material de Consumo</h3>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4">Tipo</th>
                    <th className="text-left px-6 py-4">Descrição</th>
                    <th className="text-right px-6 py-4">Quantidade</th>
                    <th className="text-center px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterialConsumo.map((material) => (
                    <tr key={material.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                          <Package size={14} />
                          {material.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">{material.descricao}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={material.quantidade <= 5 ? 'text-yellow-600 font-medium' : ''}>
                          {material.quantidade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(material, 'consumo')}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(material.id, 'consumo')}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Material Permanente</h3>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4">Tipo</th>
                    <th className="text-left px-6 py-4">Patrimônio</th>
                    <th className="text-left px-6 py-4">Modelo</th>
                    <th className="text-left px-6 py-4">Marca</th>
                    <th className="text-center px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterialPermanente.map((material) => (
                    <tr key={material.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                          <Package size={14} />
                          {material.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {material.patrimonio}
                        </span>
                      </td>
                      <td className="px-6 py-4">{material.modelo || 'N/A'}</td>
                      <td className="px-6 py-4">{material.marca || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(material, 'permanente')}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(material.id, 'permanente')}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4">{editingMaterial ? 'Editar Material' : 'Novo Material'}</h3>
            
            <div className="mb-4">
              <label className="block mb-2">Tipo de Material</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="consumo"
                    checked={materialType === 'consumo'}
                    onChange={(e) => setMaterialType(e.target.value as 'consumo' | 'permanente')}
                  />
                  Material de Consumo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="permanente"
                    checked={materialType === 'permanente'}
                    onChange={(e) => setMaterialType(e.target.value as 'consumo' | 'permanente')}
                  />
                  Material Permanente
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Tipo</label>
                <input
                  type="text"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  placeholder="Ex: Informática, Limpeza, Escritório"
                  required
                />
              </div>

              {materialType === 'consumo' ? (
                <>
                  <div>
                    <label className="block mb-2">Descrição</label>
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                      placeholder="Ex: Caneta esferográfica azul"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Quantidade</label>
                    <input
                      type="number"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                      placeholder="Ex: 100"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block mb-2">Número do Patrimônio</label>
                    <input
                      type="text"
                      value={formData.patrimonio}
                      onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                      placeholder="Ex: 2024001"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2">Modelo</label>
                      <input
                        type="text"
                        value={formData.modelo}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                        placeholder="Ex: Dell OptiPlex 7090"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Marca</label>
                      <input
                        type="text"
                        value={formData.marca}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                        placeholder="Ex: Dell"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg resize-none"
                      rows={3}
                      placeholder="Descrição detalhada do material"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMaterial(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingMaterial ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
