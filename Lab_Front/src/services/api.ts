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
  quantidade_minima?: number;
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

export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  coordenador: string;
  membros?: string;
  data_inicio: string;
  data_previsao: string;
  data_cadastro: string;
  data_atualizacao?: string;
}

export type AtividadeTipo = 'tarefa' | 'reuniao';

export interface ProjetoAtividade {
  id?: string;
  projeto_id: string;
  titulo: string;
  descricao?: string;
  tipo?: AtividadeTipo;
  status: 'backlog' | 'todo' | 'doing' | 'done';
  responsavel?: string;
  data_conclusao?: string;
  reuniao_id?: string;
  data_cadastro?: string;
  data_atualizacao?: string;
}

export interface ProjetoReuniao {
  id?: string;
  projeto_id: string;
  atividade_id?: string;
  titulo: string;
  data_reuniao: string;
  participantes?: string;
  pauta?: string;
  resumo?: string;
  data_cadastro?: string;
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

// Tipos de Autenticação
export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
  tipo_usuario: 'aluno' | 'professor' | 'colaborador';
  nome: string;
  matricula?: string;
  curso?: string;
  cpf?: string;
  telefone?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user_type: string;
  user_id: string;
  nome: string;
  perfil_id?: string;
}

export interface User {
  id: string;
  email: string;
  tipo_usuario: 'aluno' | 'professor' | 'colaborador';
  perfil_id?: string;
  nome?: string;
}

// Função helper para requisições
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Obter token do localStorage se disponível
  const token = getStoredToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorData
      });

      // Se for 401 Unauthorized, disparar evento para logout automático
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    console.error('Request details:', { url, config });
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite excedido. O servidor demorou muito para responder.');
      }
      throw error;
    }
    
    throw new Error('Erro desconhecido ao fazer requisição');
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

// Serviço de Projetos
export const projetosService = {
  async getAll(): Promise<Projeto[]> {
    return apiRequest<Projeto[]>('/projetos');
  },

  async getById(id: string): Promise<Projeto> {
    return apiRequest<Projeto>(`/projetos/${id}`);
  },

  async create(projeto: Omit<Projeto, 'id' | 'data_cadastro' | 'data_atualizacao'>): Promise<Projeto> {
    return apiRequest<Projeto>('/projetos', {
      method: 'POST',
      body: JSON.stringify(projeto),
    });
  },

  async update(id: string, projeto: Omit<Projeto, 'id' | 'data_cadastro' | 'data_atualizacao'>): Promise<Projeto> {
    return apiRequest<Projeto>(`/projetos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projeto),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/projetos/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviço de Atividades do Projeto (Kanban)
export const projetoAtividadesService = {
  async getAll(projetoId: string): Promise<ProjetoAtividade[]> {
    return apiRequest<ProjetoAtividade[]>(`/projetos/${projetoId}/atividades`);
  },

  async getById(projetoId: string, atividadeId: string): Promise<ProjetoAtividade> {
    return apiRequest<ProjetoAtividade>(`/projetos/${projetoId}/atividades/${atividadeId}`);
  },

  async create(projetoId: string, atividade: Omit<ProjetoAtividade, 'id' | 'projeto_id' | 'data_cadastro' | 'data_atualizacao'>): Promise<ProjetoAtividade> {
    return apiRequest<ProjetoAtividade>(`/projetos/${projetoId}/atividades`, {
      method: 'POST',
      body: JSON.stringify(atividade),
    });
  },

  async update(projetoId: string, atividadeId: string, atividade: Omit<ProjetoAtividade, 'id' | 'projeto_id' | 'data_cadastro' | 'data_atualizacao'>): Promise<ProjetoAtividade> {
    return apiRequest<ProjetoAtividade>(`/projetos/${projetoId}/atividades/${atividadeId}`, {
      method: 'PUT',
      body: JSON.stringify(atividade),
    });
  },

  async delete(projetoId: string, atividadeId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/projetos/${projetoId}/atividades/${atividadeId}`, {
      method: 'DELETE',
    });
  },
};

// Serviço de Reuniões do Projeto
export const projetoReunioesService = {
  async getAll(projetoId: string): Promise<ProjetoReuniao[]> {
    return apiRequest<ProjetoReuniao[]>(`/projetos/${projetoId}/reunioes`);
  },

  async getById(projetoId: string, reuniaoId: string): Promise<ProjetoReuniao> {
    return apiRequest<ProjetoReuniao>(`/projetos/${projetoId}/reunioes/${reuniaoId}`);
  },

  async create(projetoId: string, reuniao: Omit<ProjetoReuniao, 'id' | 'data_cadastro' | 'data_atualizacao'>): Promise<ProjetoReuniao> {
    return apiRequest<ProjetoReuniao>(`/projetos/${projetoId}/reunioes`, {
      method: 'POST',
      body: JSON.stringify(reuniao),
    });
  },

  async update(projetoId: string, reuniaoId: string, reuniao: Omit<ProjetoReuniao, 'id' | 'projeto_id' | 'data_cadastro' | 'data_atualizacao'>): Promise<ProjetoReuniao> {
    return apiRequest<ProjetoReuniao>(`/projetos/${projetoId}/reunioes/${reuniaoId}`, {
      method: 'PUT',
      body: JSON.stringify(reuniao),
    });
  },

  async delete(projetoId: string, reuniaoId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/projetos/${projetoId}/reunioes/${reuniaoId}`, {
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

// Serviço de Autenticação
export const authService = {
  async login(credentials: UserLogin): Promise<Token> {
    return apiRequest<Token>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(userData: UserRegister): Promise<Token> {
    return apiRequest<Token>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getMe(token: string): Promise<User> {
    return apiRequest<User>('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Função para obter token armazenado
export const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Função para armazenar token
export const storeToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

// Função para remover token
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// Função para obter usuário armazenado
export const getStoredUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

// Função para armazenar usuário
export const storeUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Função para remover usuário
export const removeUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};
