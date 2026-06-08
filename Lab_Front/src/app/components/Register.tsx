import { useState } from 'react';
import { authService, storeToken, storeUser, User, UserRegister } from '../../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState<UserRegister>({
    email: '',
    password: '',
    tipo_usuario: 'aluno',
    nome: '',
    matricula: '',
    curso: '',
    cpf: '',
    telefone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Iniciando registro...', formData);

      // Validações
      if (formData.tipo_usuario === 'aluno' && (!formData.matricula || !formData.curso)) {
        setError('Matrícula e curso são obrigatórios para alunos');
        setLoading(false);
        return;
      }
      if (formData.tipo_usuario === 'professor' && !formData.matricula) {
        setError('Matrícula é obrigatória para professores');
        setLoading(false);
        return;
      }
      if (formData.tipo_usuario === 'colaborador' && !formData.cpf) {
        setError('CPF é obrigatório para colaboradores');
        setLoading(false);
        return;
      }

      console.log('Chamando API de registro...');
      const response = await authService.register(formData);
      console.log('Resposta da API:', response);
      
      // Armazenar token e usuário
      storeToken(response.access_token);
      storeUser({
        id: response.user_id,
        email: formData.email,
        tipo_usuario: response.user_type as User['tipo_usuario'],
        perfil_id: response.perfil_id,
        nome: response.nome,
      });

      onRegisterSuccess();
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8000');
      } else if (errorMessage.includes('Tempo limite')) {
        setError('O servidor demorou muito para responder. Tente novamente.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Criar Conta
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Preencha os dados para se cadastrar no sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_usuario">Tipo de Usuário</Label>
              <Select
                value={formData.tipo_usuario}
                onValueChange={(value) => setFormData({ ...formData, tipo_usuario: value as any })}
                disabled={loading}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                disabled={loading}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                disabled={loading}
                className="h-12"
              />
            </div>
            
            {formData.tipo_usuario === 'aluno' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    type="text"
                    placeholder="Sua matrícula"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    required
                    disabled={loading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curso">Curso</Label>
                  <Input
                    id="curso"
                    type="text"
                    placeholder="Seu curso"
                    value={formData.curso}
                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                    required
                    disabled={loading}
                    className="h-12"
                  />
                </div>
              </>
            )}
            
            {formData.tipo_usuario === 'professor' && (
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  type="text"
                  placeholder="Sua matrícula"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12"
                />
              </div>
            )}
            
            {formData.tipo_usuario === 'colaborador' && (
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                disabled={loading}
                className="h-12"
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Já tem uma conta? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                disabled={loading}
              >
                Faça login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
