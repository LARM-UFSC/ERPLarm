const API_BASE_URL = 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  detail?: string;
}

// Tipos para a API do Sistema Acadêmico
export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  curso: string;
  telefone?: string;
  email?: string;
  data_cadastro: string;
}

export interface Professor {
  id: string;
  nome: string;
  matricula: string;
  telefone?: string;
  email?: string;
  data_cadastro: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
  data_cadastro: string;
}

export interface MaterialConsumo {
  id: string;
  tipo: string;
  descricao: string;
  quantidade: number;
  data_cadastro: string;
  data_atualizacao?: string;
}

export interface MaterialPermanente {
  id: string;
  tipo: string;
  patrimonio: string;
  modelo?: string;
  marca?: string;
  descricao?: string;
  data_cadastro: string;
  data_atualizacao?: string;
}

export interface Stats {
  alunos: number;
  professores: number;
  colaboradores: number;
  material_consumo: number;
  material_permanente: number;
  total_items_consumo: number;
}

// Função helper para requisições
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorData
      });
      throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    console.error('Request details:', { url, config });
    throw error;
  }
}

// Serviço de Alunos
export const alunosService = {
  async getAll(): Promise<Aluno[]> {
    return apiRequest<Aluno[]>('/alunos');
  },

  async getById(id: string): Promise<Aluno> {
    return apiRequest<Aluno>(`/alunos/${id}`);
  },

  async create(aluno: Omit<Aluno, 'id' | 'data_cadastro'>): Promise<Aluno> {
    return apiRequest<Aluno>('/alunos', {
      method: 'POST',
      body: JSON.stringify(aluno),
    });
  },

  async update(id: string, aluno: Omit<Aluno, 'id' | 'data_cadastro'>): Promise<Aluno> {
    return apiRequest<Aluno>(`/alunos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(aluno),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/alunos/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviço de Professores
export const professoresService = {
  async getAll(): Promise<Professor[]> {
    return apiRequest<Professor[]>('/professores');
  },

  async getById(id: string): Promise<Professor> {
    return apiRequest<Professor>(`/professores/${id}`);
  },

  async create(professor: Omit<Professor, 'id' | 'data_cadastro'>): Promise<Professor> {
    return apiRequest<Professor>('/professores', {
      method: 'POST',
      body: JSON.stringify(professor),
    });
  },

  async update(id: string, professor: Omit<Professor, 'id' | 'data_cadastro'>): Promise<Professor> {
    return apiRequest<Professor>(`/professores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(professor),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/professores/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviço de Colaboradores
export const colaboradoresService = {
  async getAll(): Promise<Colaborador[]> {
    return apiRequest<Colaborador[]>('/colaboradores');
  },

  async getById(id: string): Promise<Colaborador> {
    return apiRequest<Colaborador>(`/colaboradores/${id}`);
  },

  async create(colaborador: Omit<Colaborador, 'id' | 'data_cadastro'>): Promise<Colaborador> {
    return apiRequest<Colaborador>('/colaboradores', {
      method: 'POST',
      body: JSON.stringify(colaborador),
    });
  },

  async update(id: string, colaborador: Omit<Colaborador, 'id' | 'data_cadastro'>): Promise<Colaborador> {
    return apiRequest<Colaborador>(`/colaboradores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(colaborador),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/colaboradores/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviço de Material de Consumo
export const materialConsumoService = {
  async getAll(): Promise<MaterialConsumo[]> {
    return apiRequest<MaterialConsumo[]>('/material-consumo');
  },

  async getById(id: string): Promise<MaterialConsumo> {
    return apiRequest<MaterialConsumo>(`/material-consumo/${id}`);
  },

  async create(material: Omit<MaterialConsumo, 'id' | 'data_cadastro' | 'data_atualizacao'>): Promise<MaterialConsumo> {
    return apiRequest<MaterialConsumo>('/material-consumo', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  },

  async update(id: string, material: Omit<MaterialConsumo, 'id' | 'data_cadastro' | 'data_atualizacao'>): Promise<MaterialConsumo> {
    return apiRequest<MaterialConsumo>(`/material-consumo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/material-consumo/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviço de Material Permanente
export const materialPermanenteService = {
  async getAll(): Promise<MaterialPermanente[]> {
    return apiRequest<MaterialPermanente[]>('/material-permanente');
  },

  async getById(id: string): Promise<MaterialPermanente> {
    return apiRequest<MaterialPermanente>(`/material-permanente/${id}`);
  },

  async create(material: Omit<MaterialPermanente, 'id' | 'data_cadastro' | 'data_atualizacao'>): Promise<MaterialPermanente> {
    return apiRequest<MaterialPermanente>('/material-permanente', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  },

  async update(id: string, material: Omit<MaterialPermanente, 'id' | 'data_cadastro' | 'data_atualizacao'>): Promise<MaterialPermanente> {
    return apiRequest<MaterialPermanente>(`/material-permanente/${id}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/material-permanente/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviço de Estatísticas
export const statsService = {
  async get(): Promise<Stats> {
    return apiRequest<Stats>('/stats');
  },
};

// Health check
export const healthService = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return apiRequest<{ status: string; timestamp: string }>('/health');
  },
};
